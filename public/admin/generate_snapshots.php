<?php
/**
 * Admin Utility: Generate Snapshots for Existing Plots
 * This script should only be run by an administrator after implementing the snapshot feature
 */

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php';

// Ensure user is logged in and has admin privileges
$userObj = new User();
if (!$userObj->isLoggedIn() || !$userObj->hasRole([2, 3])) {
    if (isAjaxRequest()) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
        exit;
    } else {
        header('Location: /');
        exit;
    }
}

// Helper function to determine if this is an AJAX request
function isAjaxRequest() {
    return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
}

// Set content type correctly
if (isAjaxRequest()) {
    header('Content-Type: application/json');
} else {
    // Only for the HTML interface do we include the header
    // Set page title for header
    $current_page = "Generate Snapshots";
    include PRIVATE_PATH . '/templates/header.php';
}

// Connect to database
$db = Database::getInstance();

// Process batch of plots if requested
if (isset($_GET['process']) && $_GET['process'] === 'true') {
    // Always wrap AJAX processing in try/catch to ensure clean JSON is returned
    try {
        $batchSize = isset($_GET['batch_size']) ? (int)$_GET['batch_size'] : 5;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        // Get a batch of plots without snapshots
        $plots = $db->fetchAll("
            SELECT p.plot_id, p.venue_id, p.user_venue_id
            FROM saved_plots p
            WHERE p.snapshot_filename IS NULL
            LIMIT ? OFFSET ?
        ", [$batchSize, $offset]);
        
        $results = [];
        $processedCount = 0;
        
        // Process each plot
        foreach ($plots as $plot) {
            $plotId = $plot['plot_id'];
            
            // Get the elements for this plot
            $elements = $db->fetchAll("
                SELECT *
                FROM placed_elements
                WHERE plot_id = ?
                ORDER BY z_index ASC
            ", [$plotId]);
            
            if (empty($elements)) {
                $results[] = [
                    'plot_id' => $plotId,
                    'status' => 'skipped',
                    'message' => 'No elements found'
                ];
                continue;
            }
            
            // Generate snapshot
            $snapshotFilename = generatePlotSnapshot(
                $plotId, 
                $elements, 
                $plot['venue_id'], 
                $plot['user_venue_id']
            );
            
            if ($snapshotFilename) {
                // Update the plot with the snapshot filename
                $db->query(
                    "UPDATE saved_plots SET snapshot_filename = ? WHERE plot_id = ?",
                    [$snapshotFilename, $plotId]
                );
                
                $results[] = [
                    'plot_id' => $plotId,
                    'status' => 'success',
                    'filename' => $snapshotFilename
                ];
                
                $processedCount++;
            } else {
                $results[] = [
                    'plot_id' => $plotId,
                    'status' => 'error',
                    'message' => 'Failed to generate snapshot'
                ];
            }
        }
        
        // Get total remaining
        $remaining = $db->fetchOne("
            SELECT COUNT(*) as count
            FROM saved_plots
            WHERE snapshot_filename IS NULL
        ");
        
        echo json_encode([
            'success' => true,
            'processed' => $processedCount,
            'results' => $results,
            'remaining' => $remaining ? $remaining['count'] : 0,
            'next_offset' => $offset + $batchSize
        ]);
        exit;
    } catch (Exception $e) {
        // Always return proper JSON for errors in AJAX requests
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
        exit;
    }
}

// If not AJAX or not processing, show the HTML interface
// Get count of plots without snapshots
$countResult = $db->fetchOne("
    SELECT COUNT(*) as count
    FROM saved_plots
    WHERE snapshot_filename IS NULL
");

$plotCount = $countResult ? $countResult['count'] : 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generate Plot Snapshots</title>
    <style>
        #progress-container {
            margin: 20px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
            overflow: hidden;
        }
        #progress-bar {
            height: 20px;
            background-color: #4CAF50;
            width: 0%;
            transition: width 0.3s;
            text-align: center;
            line-height: 20px;
            color: white;
        }
        #log {
            height: 200px;
            border: 1px solid #ccc;
            padding: 10px;
            overflow-y: auto;
            margin-top: 20px;
            border-radius: 4px;
            background-color: #f8f8f8;
            font-family: monospace;
        }
        .success { color: green; }
        .error { color: red; }
        .skipped { color: orange; }
    </style>
</head>
<body>

<div class="profile-container">
    <h2>Generate Plot Snapshots</h2>
    
    <p>This tool will generate snapshots for all plots that don't have one yet.</p>
    
    <p>Found <strong><?= $plotCount ?></strong> plots without snapshots.</p>
    
    <?php if ($plotCount > 0): ?>
        <button id="start-button" class="primary-button">Start Generation</button>
        <button id="stop-button" class="delete-button" disabled>Stop</button>
        
        <div id="progress-container">
            <div id="progress-bar">0%</div>
        </div>
        
        <div>
            <p>Progress: <span id="processed-count">0</span> / <span id="total-count"><?= $plotCount ?></span></p>
        </div>
        
        <div id="log"></div>
    <?php else: ?>
        <p>All plots have snapshots! Nothing to do.</p>
    <?php endif; ?>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const startButton = document.getElementById('start-button');
        const stopButton = document.getElementById('stop-button');
        const progressBar = document.getElementById('progress-bar');
        const processedCount = document.getElementById('processed-count');
        const totalCount = document.getElementById('total-count');
        const log = document.getElementById('log');
        
        let isRunning = false;
        let totalPlots = <?= $plotCount ?>;
        let processed = 0;
        let offset = 0;
        const batchSize = 5;
        
        startButton.addEventListener('click', function() {
            if (!isRunning) {
                isRunning = true;
                startButton.disabled = true;
                stopButton.disabled = false;
                processNextBatch();
            }
        });
        
        stopButton.addEventListener('click', function() {
            isRunning = false;
            startButton.disabled = false;
            stopButton.disabled = true;
            logMessage('Generation stopped by user', 'info');
        });
        
        function processNextBatch() {
            if (!isRunning) return;
            
            logMessage(`Processing batch starting at offset ${offset}...`, 'info');
            
            // Add a timestamp to prevent caching
            const timestamp = new Date().getTime();
            fetch(`?process=true&batch_size=${batchSize}&offset=${offset}&_=${timestamp}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => {
                    // Check if response is JSON
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        return response.text().then(text => {
                            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // Update processed count
                        processed += data.processed;
                        processedCount.textContent = processed;
                        
                        // Update progress bar
                        const percentage = Math.min(100, Math.round((processed / totalPlots) * 100));
                        progressBar.style.width = percentage + '%';
                        progressBar.textContent = percentage + '%';
                        
                        // Log results
                        data.results.forEach(result => {
                            if (result.status === 'success') {
                                logMessage(`Plot ${result.plot_id}: Generated snapshot ${result.filename}`, 'success');
                            } else if (result.status === 'error') {
                                logMessage(`Plot ${result.plot_id}: ${result.message}`, 'error');
                            } else if (result.status === 'skipped') {
                                logMessage(`Plot ${result.plot_id}: Skipped - ${result.message}`, 'skipped');
                            }
                        });
                        
                        // Update remaining count and offset
                        totalCount.textContent = data.processed + data.remaining;
                        offset = data.next_offset;
                        
                        // Continue if there are more plots to process
                        if (data.remaining > 0 && isRunning) {
                            setTimeout(processNextBatch, 500);
                        } else {
                            isRunning = false;
                            startButton.disabled = data.remaining === 0;
                            stopButton.disabled = true;
                            
                            if (data.remaining === 0) {
                                logMessage('All plots processed successfully!', 'success');
                            } else {
                                logMessage('Generation paused. Click Start to continue.', 'info');
                            }
                        }
                    } else {
                        logMessage(`Error: ${data.error}`, 'error');
                        isRunning = false;
                        startButton.disabled = false;
                        stopButton.disabled = true;
                    }
                })
                .catch(error => {
                    logMessage(`Error: ${error.message}`, 'error');
                    isRunning = false;
                    startButton.disabled = false;
                    stopButton.disabled = true;
                });
        }
        
        function logMessage(message, type) {
            const entry = document.createElement('div');
            entry.className = type;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
        }
    });
</script>

</body>
</html>
<?php
include PRIVATE_PATH . '/templates/footer.php';
?>
