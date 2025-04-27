<?php

/**
 * Database connection manager
 * @package StageWrite
 */
class Database
{
  private static $instance = null;
  private $pdo;

  /**
   * Private constructor to prevent direct instantiation
   */
  private function __construct()
  {
    global $db_host, $db_name, $db_user, $db_password;

    try {
      $this->pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_password,
        [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES => false
        ]
      );
    } catch (PDOException $e) {
      error_log("Database connection failed: " . $e->getMessage());
      throw new Exception("Database connection failed");
    }
  }

  /**
   * Get database instance (singleton pattern)
   * * @return Database Database instance
   */
  public static function getInstance()
  {
    if (self::$instance === null) {
      self::$instance = new self();
    }
    return self::$instance;
  }

  /**
   * Get PDO connection object
   * * @return PDO PDO connection
   */
  public function getConnection()
  {
    return $this->pdo;
  }

  /**
   * Run a query with parameters
   * * @param string $sql SQL query
   * @param array $params Parameters for prepared statement
   * @return PDOStatement|false Query result
   */
  public function query($sql, $params = [])
  {
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
  }

  /**
   * Fetch a single row
   * * @param string $sql SQL query
   * @param array $params Parameters for prepared statement
   * @return array|false Row data or false
   */
  public function fetchOne($sql, $params = [])
  {
    $stmt = $this->query($sql, $params);
    return $stmt->fetch();
  }

  /**
   * Fetch all rows
   * * @param string $sql SQL query
   * @param array $params Parameters for prepared statement
   * @return array All rows
   */
  public function fetchAll($sql, $params = [])
  {
    $stmt = $this->query($sql, $params);
    return $stmt->fetchAll();
  }
}
