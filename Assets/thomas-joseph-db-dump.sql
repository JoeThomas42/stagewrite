-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 28, 2025 at 10:07 PM
-- Server version: 10.6.20-MariaDB-cll-lve
-- PHP Version: 8.3.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `jrtdesig_stagewrite`
--
CREATE DATABASE IF NOT EXISTS `jrtdesig_stagewrite` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jrtdesig_stagewrite`;

-- --------------------------------------------------------

--
-- Table structure for table `elements`
--

CREATE TABLE `elements` (
  `element_id` int(11) NOT NULL,
  `element_name` varchar(15) NOT NULL,
  `category_id` int(11) NOT NULL,
  `element_image` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `elements`
--

INSERT INTO `elements` (`element_id`, `element_name`, `category_id`, `element_image`) VALUES
(1, 'Drum Kit', 3, 'drum-set-1.png'),
(2, 'Electric Guitar', 3, 'electric-guitar-1.png'),
(3, 'Accustic Guitar', 3, 'accustic-guitar-1.png'),
(4, 'Bass Guitar', 3, 'bass-guitar-1.png'),
(5, 'Alto Sax', 3, 'alto-sax-2.png'),
(6, 'Baritone Sax', 3, 'baritone-sax-1.png'),
(7, 'Steel Drum', 3, 'steel-drum-1.png'),
(8, 'Bongo', 3, 'bongo-1.png'),
(9, 'Bongos', 3, 'bongo-2.png'),
(10, 'Bass Drum', 3, 'bass-drum-1.png'),
(11, 'Bass Drum', 3, 'bass-drum-2.png'),
(12, 'Trumpet', 3, 'trumpet-1.png'),
(13, 'Trombone', 3, 'trombone-1.png'),
(14, 'Amp', 4, 'amp-1.png'),
(15, 'Amp', 4, 'amp-2.png'),
(16, 'Speaker', 7, 'speaker-1.png'),
(17, 'Speaker Stand', 7, 'speaker-2.png'),
(18, 'Stage Monitor', 7, 'stage-monitor-1.png'),
(19, 'Mic Stand', 11, 'mic-1.png'),
(20, 'Mixing Board', 11, 'mixing-board-1.png'),
(21, 'Mixing Board', 11, 'mixing-board-2.png'),
(22, 'Input', 11, 'cable-1.png'),
(23, 'Cable', 11, 'cable-2.png'),
(24, 'Podium', 6, 'podium-1.png'),
(25, 'Stairs', 6, 'stairs-1.png'),
(26, 'Stairs', 6, 'stairs-2.png'),
(27, 'Wall', 6, 'wall-1.png'),
(28, 'Wall', 6, 'wall-2.png'),
(29, 'High Spotlight', 5, 'spotlight-1.png'),
(30, 'Low Spotlight', 5, 'spotlight-2.png'),
(31, 'Studio Light', 5, 'studio-light-1.png'),
(32, 'Studio Light', 5, 'studio-light-2.png'),
(33, 'People', 10, 'people-1.png'),
(34, 'Person', 10, 'people-2.png'),
(35, 'Crowd', 10, 'people-3.png');

-- --------------------------------------------------------

--
-- Table structure for table `element_categories`
--

CREATE TABLE `element_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `element_categories`
--

INSERT INTO `element_categories` (`category_id`, `category_name`) VALUES
(1, 'Favorites'),
(3, 'Instruments'),
(4, 'Amplifiers'),
(5, 'Lighting'),
(6, 'Staging'),
(7, 'Speakers'),
(10, 'People'),
(11, 'Audio Equipment');

-- --------------------------------------------------------

--
-- Table structure for table `email_log`
--

CREATE TABLE `email_log` (
  `log_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `plot_id` int(11) DEFAULT NULL,
  `sent_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_log`
--

INSERT INTO `email_log` (`log_id`, `user_id`, `recipient_email`, `subject`, `plot_id`, `sent_at`) VALUES
(8, '840b812e-ec97-11ef-bb3f-0a0027000006', 'joethomas42@gmail.com', 'Stage Plot: TEEEEEEST', 125, '2025-04-26 10:10:54'),
(9, '840b812e-ec97-11ef-bb3f-0a0027000006', 'joethomas42@gmail.com', 'Stage Plot: Big Ol Band', 127, '2025-04-27 11:51:16'),
(10, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 'joethomas42@gmail.com', 'Stage Plot: First Gig', 140, '2025-04-27 12:16:47');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `placed_elements`
--

CREATE TABLE `placed_elements` (
  `placed_id` int(11) NOT NULL,
  `element_id` int(11) NOT NULL,
  `plot_id` int(11) NOT NULL,
  `x_position` float NOT NULL,
  `y_position` float NOT NULL,
  `width` float NOT NULL,
  `height` float NOT NULL,
  `flipped` tinyint(1) NOT NULL DEFAULT 0,
  `z_index` int(11) NOT NULL,
  `label` varchar(10) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `placed_elements`
--

INSERT INTO `placed_elements` (`placed_id`, `element_id`, `plot_id`, `x_position`, `y_position`, `width`, `height`, `flipped`, `z_index`, `label`, `notes`) VALUES
(8899, 1, 127, 503, 81, 75, 75, 0, 214, '', ''),
(8900, 17, 127, 52, 558, 75, 75, 0, 53, '', ''),
(8901, 16, 127, 794, 148, 75, 75, 0, 73, '', ''),
(8902, 4, 127, 158, 326, 75, 75, 0, 74, '', ''),
(8903, 4, 127, 638, 334, 75, 75, 1, 81, '', ''),
(8904, 12, 127, 468, 266, 75, 75, 1, 96, '', ''),
(8905, 12, 127, 331, 265, 75, 75, 0, 101, '', ''),
(8906, 1, 127, 292, 82, 75, 75, 0, 104, 'Joe', ''),
(8907, 2, 127, 287, 440, 75, 75, 0, 107, '', ''),
(8908, 2, 127, 509, 439, 75, 75, 0, 112, 'Kelly', '.'),
(8909, 18, 127, 205, 500, 75, 75, 0, 124, '', ''),
(8910, 19, 127, 617, 431, 75, 75, 1, 149, '', ''),
(8911, 19, 127, 185, 419, 75, 75, 0, 150, '', ''),
(8912, 29, 127, 175, 7, 75, 75, 0, 163, '', ''),
(8913, 18, 127, 596, 509, 75, 75, 0, 171, '', ''),
(8914, 30, 127, 184, 589, 75, 75, 0, 172, '', ''),
(8915, 19, 127, 397, 517, 75, 75, 0, 173, '', ''),
(8916, 18, 127, 397, 589, 75, 75, 0, 174, '', ''),
(8917, 30, 127, 592, 589, 75, 75, 1, 175, '', ''),
(8918, 16, 127, 1, 62, 75, 75, 0, 196, '', ''),
(8919, 9, 127, 396, 122, 75, 75, 0, 199, '', ''),
(8920, 31, 127, 401, 7, 75, 75, 0, 208, '', ''),
(8921, 29, 127, 662, 7, 75, 75, 1, 202, '', ''),
(8922, 16, 127, 0, 146, 75, 75, 0, 203, '', ''),
(8923, 16, 127, 795, 65, 75, 75, 0, 205, '', ''),
(8924, 17, 127, 716, 564, 75, 75, 0, 206, '', ''),
(8931, 19, 125, 398, 404, 75, 75, 0, 163, '', ''),
(8932, 2, 125, 258, 329, 75, 75, 0, 164, '', ''),
(8933, 16, 125, 676, 121, 75, 75, 0, 167, '', ''),
(8934, 16, 125, 122, 123, 75, 75, 1, 168, '', ''),
(8935, 4, 125, 540, 329, 75, 75, 1, 174, '', ''),
(8936, 1, 125, 401, 120, 75, 75, 0, 175, '', ''),
(8937, 29, 126, 684, 156, 75, 75, 1, 1, '', ''),
(8938, 35, 126, 385, 373, 75, 75, 0, 2, '', ''),
(8939, 1, 126, 389, 176, 75, 75, 0, 4, '', ''),
(8940, 2, 126, 551, 287, 75, 75, 0, 5, '', ''),
(8941, 29, 126, 120, 154, 75, 75, 0, 6, 'LIIIGHT', ''),
(8942, 2, 126, 234, 283, 75, 75, 1, 7, '', ''),
(8949, 19, 138, 557, 257, 75, 75, 0, 199, '', ''),
(8950, 29, 138, 378, 262, 75, 75, 0, 191, '', ''),
(8965, 1, 141, 179, 212, 75, 75, 0, 5, '', ''),
(8966, 2, 141, 613, 207, 75, 75, 0, 4, '', ''),
(8967, 15, 141, 521, 169, 75, 75, 0, 10, '', ''),
(8968, 32, 141, 8, 286, 75, 75, 0, 8, '', ''),
(8969, 32, 141, 782, 290, 75, 75, 0, 11, '', ''),
(8970, 17, 141, 9.5, 367.031, 75, 75, 0, 12, '', ''),
(8971, 17, 141, 784, 372, 75, 75, 0, 13, '', ''),
(8972, 19, 141, 401.5, 302.031, 75, 75, 0, 14, '', ''),
(8973, 19, 140, 398, 421, 75, 75, 0, 2, '', ''),
(8974, 4, 140, 571, 344, 75, 75, 1, 5, 'Kelly', ''),
(8975, 2, 140, 229.5, 342.031, 75, 75, 0, 6, 'Jim', ''),
(8976, 18, 140, 234.5, 481.031, 75, 75, 0, 7, '', ''),
(8977, 18, 140, 571, 482, 75, 75, 0, 9, '', ''),
(8978, 18, 140, 398.5, 527.031, 75, 75, 0, 10, '', ''),
(8979, 16, 140, 18.5, 515.031, 75, 75, 0, 12, '', ''),
(8980, 16, 140, 18, 436, 75, 75, 0, 13, '', ''),
(8981, 16, 140, 769, 512, 75, 75, 0, 14, '', ''),
(8982, 16, 140, 769, 433, 75, 75, 0, 15, '', ''),
(8983, 29, 140, 1.5, 91.0312, 75, 75, 0, 16, '', ''),
(8984, 29, 140, 793, 94, 75, 75, 1, 17, '', ''),
(8985, 20, 140, 142, 4, 75, 75, 0, 18, '', ''),
(8986, 1, 140, 399, 155, 75, 75, 0, 19, 'Joe', 'Raised up on a platform.'),
(9056, 28, 121, 148, 355, 75, 75, 0, 1, '', ''),
(9057, 28, 121, 477, 355, 75, 75, 0, 2, '', ''),
(9058, 28, 121, 553, 357, 75, 75, 0, 3, '', ''),
(9059, 28, 121, 631, 356, 75, 75, 0, 4, '', ''),
(9060, 25, 121, 65, 326, 75, 75, 0, 5, '', ''),
(9061, 28, 121, 314, 357, 75, 75, 0, 8, '', ''),
(9062, 28, 121, 226, 357, 75, 75, 0, 9, '', ''),
(9063, 19, 121, 393, 245, 75, 75, 0, 10, '', ''),
(9064, 19, 121, 109, 239, 75, 75, 0, 11, '', ''),
(9065, 2, 121, 198, 187, 75, 75, 1, 12, '', ''),
(9066, 2, 121, 586, 192, 75, 75, 0, 13, '', ''),
(9067, 18, 121, 214, 271, 75, 75, 0, 14, '', ''),
(9068, 18, 121, 572, 272, 75, 75, 0, 15, '', ''),
(9069, 35, 121, 213, 462, 75, 75, 0, 16, '', ''),
(9070, 35, 121, 302, 462, 75, 75, 0, 17, '', ''),
(9071, 35, 121, 475, 460, 75, 75, 0, 18, '', ''),
(9072, 26, 121, 394, 379, 75, 75, 0, 20, '', ''),
(9073, 19, 121, 676, 239, 75, 75, 0, 21, '', ''),
(9074, 35, 121, 564, 460, 75, 75, 0, 179, '', ''),
(9075, 1, 121, 393, 115, 75, 75, 1, 172, '', ''),
(9076, 29, 121, 76, 43, 75, 75, 0, 175, 'LIIIGHT', ''),
(9077, 29, 121, 687, 36, 75, 75, 1, 176, '', ''),
(9078, 25, 121, 708, 335, 75, 75, 1, 178, '', '');

-- --------------------------------------------------------

--
-- Table structure for table `plot_inputs`
--

CREATE TABLE `plot_inputs` (
  `input_id` int(11) NOT NULL,
  `plot_id` int(11) NOT NULL,
  `input_number` int(11) NOT NULL,
  `input_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plot_inputs`
--

INSERT INTO `plot_inputs` (`input_id`, `plot_id`, `input_number`, `input_name`) VALUES
(559, 127, 1, 'One'),
(560, 127, 2, 'Two'),
(561, 127, 3, 'Three'),
(562, 125, 1, 'Test'),
(563, 125, 2, 'Testty'),
(565, 140, 1, 'Off stage mic'),
(571, 121, 1, 'Test'),
(572, 121, 2, 'Test 2');

-- --------------------------------------------------------

--
-- Table structure for table `saved_plots`
--

CREATE TABLE `saved_plots` (
  `plot_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `plot_name` varchar(20) NOT NULL,
  `event_date_start` date DEFAULT NULL,
  `event_date_end` date DEFAULT NULL,
  `venue_id` int(11) DEFAULT NULL,
  `user_venue_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `snapshot_filename` varchar(255) DEFAULT NULL,
  `snapshot_version` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saved_plots`
--

INSERT INTO `saved_plots` (`plot_id`, `user_id`, `plot_name`, `event_date_start`, `event_date_end`, `venue_id`, `user_venue_id`, `created_at`, `updated_at`, `snapshot_filename`, `snapshot_version`) VALUES
(121, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Oh man another test', '2025-04-01', '2025-04-01', 8, NULL, '2025-04-01 17:33:14', '2025-04-28 20:50:12', 'plot_121_1743528796.png', 1745873412),
(125, '840b812e-ec97-11ef-bb3f-0a0027000006', 'TEEEEEEST', '2025-04-01', '2025-04-01', 17, NULL, '2025-04-01 19:01:30', '2025-04-27 05:33:07', 'plot_125.png', 1745731987),
(126, '840b812e-ec97-11ef-bb3f-0a0027000006', 'TEST', '2025-04-01', '2025-04-01', 17, NULL, '2025-04-03 13:49:11', '2025-04-27 13:28:31', 'plot_126.png', 1745760511),
(127, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Big Ol Band', '2025-04-01', '2025-04-01', 5, NULL, '2025-04-10 17:19:09', '2025-04-27 01:19:37', 'plot_127.png', 1745716778),
(138, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Test again', '2025-04-22', '2025-04-22', 2, NULL, '2025-04-22 03:47:56', '2025-04-27 14:27:06', 'plot_138.png', 1745764027),
(140, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 'First Gig', '2025-04-27', '2025-04-27', 12, NULL, '2025-04-27 15:00:26', '2025-04-27 16:16:36', 'plot_140.png', 1745770596),
(141, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 'Garage Jam', '2025-04-27', '2025-04-27', NULL, 39, '2025-04-27 15:03:08', '2025-04-27 15:03:08', 'plot_141.png', 1745766188);

-- --------------------------------------------------------

--
-- Table structure for table `states`
--

CREATE TABLE `states` (
  `state_id` int(11) NOT NULL,
  `state_name` varchar(100) NOT NULL,
  `state_abbr` char(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `states`
--

INSERT INTO `states` (`state_id`, `state_name`, `state_abbr`) VALUES
(1, 'North Carolina', 'NC'),
(2, 'South Carolina', 'SC'),
(3, 'Tennessee', 'TN'),
(4, 'Georgia', 'GA'),
(6, 'Alabama', 'AL'),
(7, 'Alaska', 'AK'),
(8, 'Arizona', 'AZ'),
(9, 'Arkansas', 'AR'),
(10, 'California', 'CA'),
(11, 'Colorado', 'CO'),
(12, 'Connecticut', 'CT'),
(13, 'Delaware', 'DE'),
(14, 'Florida', 'FL'),
(15, 'Hawaii', 'HI'),
(16, 'Idaho', 'ID'),
(17, 'Illinois', 'IL'),
(18, 'Indiana', 'IN'),
(19, 'Iowa', 'IA'),
(20, 'Kansas', 'KS'),
(21, 'Kentucky', 'KY'),
(22, 'Louisiana', 'LA'),
(23, 'Maine', 'ME'),
(24, 'Maryland', 'MD'),
(25, 'Massachusetts', 'MA'),
(26, 'Michigan', 'MI'),
(27, 'Minnesota', 'MN'),
(28, 'Mississippi', 'MS'),
(29, 'Missouri', 'MO'),
(30, 'Montana', 'MT'),
(31, 'Nebraska', 'NE'),
(32, 'Nevada', 'NV'),
(33, 'New Hampshire', 'NH'),
(34, 'New Jersey', 'NJ'),
(35, 'New Mexico', 'NM'),
(36, 'New York', 'NY'),
(37, 'North Dakota', 'ND'),
(38, 'Ohio', 'OH'),
(39, 'Oklahoma', 'OK'),
(40, 'Oregon', 'OR'),
(41, 'Pennsylvania', 'PA'),
(42, 'Rhode Island', 'RI'),
(43, 'South Dakota', 'SD'),
(44, 'Texas', 'TX'),
(45, 'Utah', 'UT'),
(46, 'Vermont', 'VT'),
(47, 'Virginia', 'VA'),
(48, 'Washington', 'WA'),
(49, 'West Virginia', 'WV'),
(50, 'Wisconsin', 'WI'),
(51, 'Wyoming', 'WY'),
(52, 'District of Columbia', 'DC');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `password_hash`, `email`, `first_name`, `last_name`, `role_id`, `created_at`, `is_active`) VALUES
('01605b3c-fe88-11ef-b270-ac1f6bd8cd8c', '$2y$10$Kxr0hyaQb.zLfrN5Hj8bTeNRKivvNa.gjEFEQyGHqQal8oyuGgx9W', 'adalie.marie@gmail.com', 'Addie', 'Thomas', 2, '2025-03-11 14:49:03', 1),
('1d0a4f46-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin1@admin.com', 'Jane', 'Smith', 2, '2025-02-01 16:25:11', 0),
('1d0b4301-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member1@example.com', 'Emily', 'Brown', 1, '2025-02-01 16:25:11', 0),
('1d0b4484-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member2@example.com', 'David', 'Williams', 1, '2025-02-01 16:25:11', 1),
('1d0b44f3-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member3@example.com', 'Sarah', 'Jones', 1, '2025-02-01 16:25:11', 1),
('1d0b458b-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member5@example.com', 'Linda', 'Martinez', 1, '2025-02-01 16:25:11', 1),
('1d0b45df-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member6@example.com', 'Robert', 'Hernandez', 1, '2025-02-01 16:25:11', 1),
('1d0b4667-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member8@example.com', 'William', 'Gonzalez', 1, '2025-02-01 16:25:11', 1),
('1d0b46e9-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member10@example.com', 'Richard', 'Anderson', 1, '2025-02-01 16:25:11', 1),
('1d0b4733-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member11@example.com', 'Mary', 'Thomas', 1, '2025-02-01 16:25:11', 1),
('1d0b4851-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member15@example.com', 'Barbara', 'White', 1, '2025-02-01 16:25:11', 1),
('1d0b4896-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member16@example.com', 'Charles', 'Harris', 1, '2025-02-01 16:25:11', 1),
('1d0b4916-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member18@example.com', 'Christopher', 'Lewis', 1, '2025-02-01 16:25:11', 1),
('1d0b4999-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member20@example.com', 'Daniel', 'Walker', 1, '2025-02-01 16:25:11', 1),
('1d0b49e2-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member21@example.com', 'Karen', 'Perez', 1, '2025-02-01 16:25:11', 1),
('1d0b4a29-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member22@example.com', 'Matthew', 'Hall', 1, '2025-02-01 16:25:11', 0),
('1d0b4cf5-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member27@example.com', 'Betty', 'Scott', 1, '2025-02-01 16:25:11', 1),
('1d0b4d83-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member29@example.com', 'Dorothy', 'Baker', 1, '2025-02-01 16:25:11', 0),
('1d0b4e66-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member32@example.com', 'Steven', 'Carter', 1, '2025-02-01 16:25:11', 1),
('1d0b4f03-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member34@example.com', 'Kimberly', 'Perez', 1, '2025-02-01 16:25:11', 1),
('840b812e-ec97-11ef-bb3f-0a0027000006', '$2y$10$TB.6sScWASdbcigkTkbjDe9XLNtnGpUSdOVo5UR6RHqHf3Cwtjnwq', 'joethomas42@gmail.com', 'Joe', 'Thomas', 3, '2025-02-16 18:54:57', 1),
('a76e6844-240f-11f0-9986-ac1f6bd8cd8c', '$2y$10$8TzfLh2dwlq6Z35FuMPJfebsx.ZHZc1R67zcQUWp0aAJaul4P9KLS', 'murphyaetelrikv@gmail.com', 'DdAfGpjpzc', 'lpjJMaKFZXnYPO', 1, '2025-04-28 09:03:20', 1),
('be51bd93-2376-11f0-9986-ac1f6bd8cd8c', '$2y$10$.61LMHyT/KPP5jR4aGlcROtrDsAgpNU1ZfWwoCcvuieR8y05PnSxi', 'Member@sample.com', 'Member', 'Sample', 1, '2025-04-27 14:48:46', 1),
('f6e707b3-2378-11f0-9986-ac1f6bd8cd8c', '$2y$10$mT4rfwAZHuUogy2YZcUCA.i/e1uNvRwi7s/df4AGqgZIAWMTje2qy', 'Admin@sample.com', 'Admin', 'Sample', 2, '2025-04-27 15:04:40', 1),
('fc5e35a4-fe71-11ef-b270-ac1f6bd8cd8c', '$2y$10$BPidut5VXijRcr0A6AqGC.3/xTzU8tfWkGgD08PvThNj.2HysNEjC', 'ashleerollice@students.abtech.edu', 'Ashlee ', 'Rollice', 1, '2025-03-11 12:11:25', 1);

--
-- Triggers `users`
--
DELIMITER $$
CREATE TRIGGER `before_insert_users` BEFORE INSERT ON `users` FOR EACH ROW BEGIN
  IF NEW.user_id IS NULL THEN
    SET NEW.user_id = UUID();
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `user_favorites`
--

CREATE TABLE `user_favorites` (
  `favorite_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `element_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_favorites`
--

INSERT INTO `user_favorites` (`favorite_id`, `user_id`, `element_id`) VALUES
(128, '1d0b4301-e0b9-11ef-8f29-ac1f6bd8cd8c', 1),
(205, '1d0b4851-e0b9-11ef-8f29-ac1f6bd8cd8c', 2),
(154, '1d0b4cf5-e0b9-11ef-8f29-ac1f6bd8cd8c', 2),
(663, '840b812e-ec97-11ef-bb3f-0a0027000006', 1),
(794, '840b812e-ec97-11ef-bb3f-0a0027000006', 2),
(876, '840b812e-ec97-11ef-bb3f-0a0027000006', 4),
(878, '840b812e-ec97-11ef-bb3f-0a0027000006', 5),
(833, '840b812e-ec97-11ef-bb3f-0a0027000006', 16),
(721, '840b812e-ec97-11ef-bb3f-0a0027000006', 17),
(875, '840b812e-ec97-11ef-bb3f-0a0027000006', 18),
(861, '840b812e-ec97-11ef-bb3f-0a0027000006', 19),
(900, '840b812e-ec97-11ef-bb3f-0a0027000006', 21),
(898, '840b812e-ec97-11ef-bb3f-0a0027000006', 29),
(884, '840b812e-ec97-11ef-bb3f-0a0027000006', 32),
(907, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 1),
(908, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 2),
(906, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 4),
(910, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 16),
(911, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 18),
(904, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 19),
(905, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 20),
(909, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 29);

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`role_id`, `role_name`) VALUES
(1, 'member'),
(2, 'admin'),
(3, 'super_admin');

-- --------------------------------------------------------

--
-- Table structure for table `user_tokens`
--

CREATE TABLE `user_tokens` (
  `token_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_tokens`
--

INSERT INTO `user_tokens` (`token_id`, `user_id`, `token`, `created_at`, `expires_at`) VALUES
(117, '840b812e-ec97-11ef-bb3f-0a0027000006', '85bceac0b97d87bb2c4d891498ce7a4925857eb003b1ab7ffb3830ead82225f6', '2025-04-28 21:55:18', '2025-06-27 21:55:18');

-- --------------------------------------------------------

--
-- Table structure for table `user_venues`
--

CREATE TABLE `user_venues` (
  `user_venue_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `venue_name` varchar(100) NOT NULL,
  `venue_street` varchar(100) DEFAULT NULL,
  `venue_city` varchar(100) DEFAULT NULL,
  `venue_state_id` int(11) DEFAULT NULL,
  `venue_zip` char(5) DEFAULT NULL,
  `stage_depth` int(11) DEFAULT NULL,
  `stage_width` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_venues`
--

INSERT INTO `user_venues` (`user_venue_id`, `user_id`, `venue_name`, `venue_street`, `venue_city`, `venue_state_id`, `venue_zip`, `stage_depth`, `stage_width`) VALUES
(17, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Test add from profile', '123', '', 7, '', 30, 50),
(22, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Another Profile Test', NULL, NULL, 19, NULL, 12, 20),
(23, '840b812e-ec97-11ef-bb3f-0a0027000006', 'A NEW EDIT AGAIN', '123456', NULL, 8, NULL, 20, 30),
(28, '840b812e-ec97-11ef-bb3f-0a0027000006', 'FART BAG', NULL, NULL, 7, NULL, 30, 60),
(38, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Smeg', NULL, NULL, 4, NULL, 25, 50),
(39, 'be51bd93-2376-11f0-9986-ac1f6bd8cd8c', 'My Garage', NULL, 'Asheville', 1, NULL, 10, 15);

-- --------------------------------------------------------

--
-- Table structure for table `venues`
--

CREATE TABLE `venues` (
  `venue_id` int(11) NOT NULL,
  `venue_name` varchar(100) NOT NULL,
  `venue_street` varchar(100) NOT NULL,
  `venue_city` varchar(100) NOT NULL,
  `venue_state_id` int(11) NOT NULL,
  `venue_zip` char(5) NOT NULL,
  `stage_depth` int(11) NOT NULL,
  `stage_width` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `venues`
--

INSERT INTO `venues` (`venue_id`, `venue_name`, `venue_street`, `venue_city`, `venue_state_id`, `venue_zip`, `stage_depth`, `stage_width`) VALUES
(2, 'The Orange Peel', '101 Biltmore Ave', 'Asheville', 1, '28801', 45, 45),
(3, 'Lincoln Theatre', '126 E Cabarrus St', 'Raleigh', 1, '27601', 25, 40),
(4, 'Neighborhood Theatre', '511 E 36th St', 'Charlotte', 1, '28205', 28, 42),
(5, 'The Fillmore', '820 Hamilton St', 'Charlotte', 1, '28206', 35, 45),
(6, 'The Ritz', '2820 Industrial Dr', 'Raleigh', 1, '27609', 32, 48),
(7, 'Music Farm', '32 Ann St', 'Charleston', 2, '29403', 24, 36),
(8, 'Township Auditorium', '1703 Taylor St', 'Columbia', 2, '29201', 40, 60),
(9, 'Peace Center', '300 S Main St', 'Greenville', 2, '29601', 52, 100),
(10, 'House of Blues', '4640 Hwy 17 S', 'Myrtle Beach', 2, '29582', 30, 50),
(11, 'The Senate', '1022 Senate St', 'Columbia', 2, '29201', 26, 38),
(12, 'Ground Zero', '904 S Main St', 'Anderson', 2, '29624', 22, 30),
(13, 'Ryman Auditorium', '116 5th Ave N', 'Nashville', 3, '37219', 40, 55),
(14, 'Marathon Music Works', '1402 Clinton St', 'Nashville', 3, '37203', 32, 48),
(15, 'Exit/In', '2208 Elliston Pl', 'Nashville', 3, '37203', 24, 36),
(16, 'Mercy Lounge', '1 Cannery Row', 'Nashville', 3, '37203', 28, 42),
(17, 'Tennessee Theatre', '604 S Gay St', 'Knoxville', 3, '37902', 42, 65),
(18, 'Minglewood Hall', '1555 Madison Ave', 'Memphis', 3, '38104', 30, 45),
(19, 'The Tabernacle', '152 Luckie St NW', 'Atlanta', 4, '30303', 38, 56),
(21, 'Terminal West', '887 W Marietta St NW', 'Atlanta', 4, '30318', 28, 42),
(22, 'Variety Playhouse', '1099 Euclid Ave NE', 'Atlanta', 4, '30307', 32, 48),
(23, 'The Earl', '488 Flat Shoals Ave SE', 'Atlanta', 4, '30316', 20, 30),
(24, 'Buckhead Theatre', '3110 Roswell Rd', 'Atlanta', 4, '30305', 34, 52),
(25, 'Cat\'s Cradle', '300 E Main St', 'Carrboro', 1, '27510', 22, 38),
(32, 'Official Venue Test', '1234 Street', 'Townsville', 46, '12345', 35, 45);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `elements`
--
ALTER TABLE `elements`
  ADD PRIMARY KEY (`element_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `element_categories`
--
ALTER TABLE `element_categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `email_log`
--
ALTER TABLE `email_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `plot_id` (`plot_id`),
  ADD KEY `idx_email_log_user_id` (`user_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `placed_elements`
--
ALTER TABLE `placed_elements`
  ADD PRIMARY KEY (`placed_id`),
  ADD KEY `plot_id` (`plot_id`),
  ADD KEY `plot_z_index` (`plot_id`,`z_index`),
  ADD KEY `fk_placed_elements_element` (`element_id`);

--
-- Indexes for table `plot_inputs`
--
ALTER TABLE `plot_inputs`
  ADD PRIMARY KEY (`input_id`),
  ADD KEY `plot_input` (`plot_id`,`input_number`);

--
-- Indexes for table `saved_plots`
--
ALTER TABLE `saved_plots`
  ADD PRIMARY KEY (`plot_id`),
  ADD KEY `user_plot` (`user_id`,`plot_name`),
  ADD KEY `venue_id` (`venue_id`),
  ADD KEY `fk_saved_plots_user_venue` (`user_venue_id`);

--
-- Indexes for table `states`
--
ALTER TABLE `states`
  ADD PRIMARY KEY (`state_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD PRIMARY KEY (`favorite_id`),
  ADD UNIQUE KEY `user_element` (`user_id`,`element_id`),
  ADD KEY `fk_favorites_element` (`element_id`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `unique_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `user_venues`
--
ALTER TABLE `user_venues`
  ADD PRIMARY KEY (`user_venue_id`) USING BTREE,
  ADD KEY `venue_city` (`venue_city`) USING BTREE,
  ADD KEY `venue_state_id` (`venue_state_id`) USING BTREE,
  ADD KEY `user_id` (`user_id`) USING BTREE;

--
-- Indexes for table `venues`
--
ALTER TABLE `venues`
  ADD PRIMARY KEY (`venue_id`),
  ADD KEY `venue_city` (`venue_city`),
  ADD KEY `venue_state_id` (`venue_state_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `elements`
--
ALTER TABLE `elements`
  MODIFY `element_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `element_categories`
--
ALTER TABLE `element_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `email_log`
--
ALTER TABLE `email_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `placed_elements`
--
ALTER TABLE `placed_elements`
  MODIFY `placed_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9079;

--
-- AUTO_INCREMENT for table `plot_inputs`
--
ALTER TABLE `plot_inputs`
  MODIFY `input_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=573;

--
-- AUTO_INCREMENT for table `saved_plots`
--
ALTER TABLE `saved_plots`
  MODIFY `plot_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

--
-- AUTO_INCREMENT for table `states`
--
ALTER TABLE `states`
  MODIFY `state_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `user_favorites`
--
ALTER TABLE `user_favorites`
  MODIFY `favorite_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=923;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_tokens`
--
ALTER TABLE `user_tokens`
  MODIFY `token_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=118;

--
-- AUTO_INCREMENT for table `user_venues`
--
ALTER TABLE `user_venues`
  MODIFY `user_venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `venues`
--
ALTER TABLE `venues`
  MODIFY `venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `elements`
--
ALTER TABLE `elements`
  ADD CONSTRAINT `fk_elements_category` FOREIGN KEY (`category_id`) REFERENCES `element_categories` (`category_id`);

--
-- Constraints for table `email_log`
--
ALTER TABLE `email_log`
  ADD CONSTRAINT `fk_email_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `placed_elements`
--
ALTER TABLE `placed_elements`
  ADD CONSTRAINT `fk_placed_elements_element` FOREIGN KEY (`element_id`) REFERENCES `elements` (`element_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_placed_elements_plot` FOREIGN KEY (`plot_id`) REFERENCES `saved_plots` (`plot_id`) ON DELETE CASCADE;

--
-- Constraints for table `plot_inputs`
--
ALTER TABLE `plot_inputs`
  ADD CONSTRAINT `fk_plot_inputs_plot` FOREIGN KEY (`plot_id`) REFERENCES `saved_plots` (`plot_id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_plots`
--
ALTER TABLE `saved_plots`
  ADD CONSTRAINT `fk_saved_plots_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`role_id`);

--
-- Constraints for table `user_favorites`
--
ALTER TABLE `user_favorites`
  ADD CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_favorites_element` FOREIGN KEY (`element_id`) REFERENCES `elements` (`element_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_venues`
--
ALTER TABLE `user_venues`
  ADD CONSTRAINT `fk_user_venues_state` FOREIGN KEY (`venue_state_id`) REFERENCES `states` (`state_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_venues_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `venues`
--
ALTER TABLE `venues`
  ADD CONSTRAINT `fk_venues_state` FOREIGN KEY (`venue_state_id`) REFERENCES `states` (`state_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
