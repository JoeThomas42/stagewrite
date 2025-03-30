-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for jrtdesig_stagewrite
CREATE DATABASE IF NOT EXISTS `jrtdesig_stagewrite` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `jrtdesig_stagewrite`;

-- Dumping structure for table jrtdesig_stagewrite.elements
CREATE TABLE IF NOT EXISTS `elements` (
  `element_id` int NOT NULL AUTO_INCREMENT,
  `element_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int NOT NULL,
  `element_image` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`element_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `fk_elements_category` FOREIGN KEY (`category_id`) REFERENCES `element_categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.elements: ~2 rows (approximately)
REPLACE INTO `elements` (`element_id`, `element_name`, `category_id`, `element_image`) VALUES
	(1, 'Drum Kit', 3, 'drum-kit.jpg'),
	(2, 'Electric Guitar', 3, 'electric-guitar.png');

-- Dumping structure for table jrtdesig_stagewrite.element_categories
CREATE TABLE IF NOT EXISTS `element_categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.element_categories: ~10 rows (approximately)
REPLACE INTO `element_categories` (`category_id`, `category_name`) VALUES
	(1, 'Favorites'),
	(2, 'Microphones'),
	(3, 'Instruments'),
	(4, 'Amplifiers'),
	(5, 'Lighting'),
	(6, 'Staging'),
	(7, 'Monitors'),
	(8, 'Effects'),
	(9, 'Cables'),
	(10, 'Personnel');

-- Dumping structure for table jrtdesig_stagewrite.placed_elements
CREATE TABLE IF NOT EXISTS `placed_elements` (
  `placed_id` int NOT NULL AUTO_INCREMENT,
  `element_id` int NOT NULL,
  `plot_id` int NOT NULL,
  `x_position` float NOT NULL,
  `y_position` float NOT NULL,
  `width` float NOT NULL,
  `height` float NOT NULL,
  `rotation` float NOT NULL DEFAULT '0',
  `flipped` tinyint(1) NOT NULL DEFAULT '0',
  `z_index` int NOT NULL,
  `label` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`placed_id`),
  KEY `plot_id` (`plot_id`),
  KEY `plot_z_index` (`plot_id`,`z_index`),
  KEY `fk_placed_elements_element` (`element_id`),
  CONSTRAINT `fk_placed_elements_element` FOREIGN KEY (`element_id`) REFERENCES `elements` (`element_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_placed_elements_plot` FOREIGN KEY (`plot_id`) REFERENCES `saved_plots` (`plot_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1946 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.placed_elements: ~19 rows (approximately)
REPLACE INTO `placed_elements` (`placed_id`, `element_id`, `plot_id`, `x_position`, `y_position`, `width`, `height`, `rotation`, `flipped`, `z_index`, `label`, `notes`) VALUES
	(1690, 2, 82, 170, 241, 113, 75, 0, 0, 14, '', ''),
	(1691, 1, 82, 252, 125, 75, 75, 0, 0, 12, '', ''),
	(1692, 2, 82, 311, 226, 113, 75, 0, 0, 15, '', ''),
	(1809, 2, 104, 192, 270, 113, 75, 0, 0, 42, '', ''),
	(1810, 1, 104, 291, 120, 75, 75, 0, 0, 46, 'Joe', ''),
	(1811, 2, 104, 344, 271, 113, 75, 0, 0, 43, '', ''),
	(1812, 2, 105, 192, 270, 113, 75, 0, 0, 42, '', ''),
	(1813, 1, 105, 291, 120, 75, 75, 0, 0, 46, 'Joe', ''),
	(1814, 2, 105, 344, 271, 113, 75, 0, 0, 43, '', ''),
	(1818, 2, 107, 192, 270, 113, 75, 0, 0, 42, '', ''),
	(1819, 1, 107, 291, 120, 75, 75, 0, 0, 46, 'Joe', ''),
	(1820, 2, 107, 344, 271, 113, 75, 0, 0, 43, '', ''),
	(1844, 2, 106, 192, 270, 113, 75, 0, 0, 42, '', ''),
	(1845, 2, 106, 341, 269, 113, 75, 0, 0, 47, '', ''),
	(1846, 1, 106, 285, 119, 75, 75, 0, 0, 49, 'Joe', ''),
	(1942, 1, 109, 482, 128, 75, 75, 0, 0, 103, 'Joe', ''),
	(1943, 2, 109, 512, 299, 113, 75, 0, 0, 102, 'GHEE-TARRR', ''),
	(1944, 2, 109, 259, 294, 113, 75, 0, 0, 99, 'Kelly', ''),
	(1945, 1, 109, 330, 124, 75, 75, 0, 0, 104, '', '');

-- Dumping structure for table jrtdesig_stagewrite.plot_inputs
CREATE TABLE IF NOT EXISTS `plot_inputs` (
  `input_id` int NOT NULL AUTO_INCREMENT,
  `plot_id` int NOT NULL,
  `input_number` int NOT NULL,
  `input_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`input_id`),
  KEY `plot_input` (`plot_id`,`input_number`),
  CONSTRAINT `fk_plot_inputs_plot` FOREIGN KEY (`plot_id`) REFERENCES `saved_plots` (`plot_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=254 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.plot_inputs: ~0 rows (approximately)

-- Dumping structure for table jrtdesig_stagewrite.saved_plots
CREATE TABLE IF NOT EXISTS `saved_plots` (
  `plot_id` int NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plot_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date_start` date DEFAULT NULL,
  `event_date_end` date DEFAULT NULL,
  `venue_id` int DEFAULT NULL,
  `user_venue_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`plot_id`),
  KEY `user_plot` (`user_id`,`plot_name`),
  KEY `venue_id` (`venue_id`),
  KEY `fk_saved_plots_user_venue` (`user_venue_id`),
  CONSTRAINT `fk_saved_plots_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.saved_plots: ~6 rows (approximately)
REPLACE INTO `saved_plots` (`plot_id`, `user_id`, `plot_name`, `event_date_start`, `event_date_end`, `venue_id`, `user_venue_id`, `created_at`, `updated_at`) VALUES
	(82, '2a751dc2-084f-11f0-93b0-0a0027000006', 'TEST 4', '2025-03-24', '2025-03-24', NULL, NULL, '2025-03-24 02:49:32', '2025-03-24 02:49:32'),
	(104, '840b812e-ec97-11ef-bb3f-0a0027000006', '2', '2025-03-27', '2025-03-27', NULL, 15, '2025-03-25 05:29:08', '2025-03-25 05:29:08'),
	(105, '840b812e-ec97-11ef-bb3f-0a0027000006', '33', '2025-03-27', '2025-03-27', NULL, 15, '2025-03-25 05:29:10', '2025-03-25 05:29:10'),
	(106, '840b812e-ec97-11ef-bb3f-0a0027000006', '3', '2025-03-27', '2025-03-27', NULL, 15, '2025-03-25 05:29:13', '2025-03-26 18:05:14'),
	(107, '840b812e-ec97-11ef-bb3f-0a0027000006', '4', '2025-03-27', '2025-03-27', NULL, 15, '2025-03-25 05:29:16', '2025-03-25 05:29:16'),
	(109, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Moomaoma', '2025-04-08', '2025-04-08', NULL, 4, '2025-03-26 18:11:12', '2025-03-30 14:59:52');

-- Dumping structure for table jrtdesig_stagewrite.states
CREATE TABLE IF NOT EXISTS `states` (
  `state_id` int NOT NULL AUTO_INCREMENT,
  `state_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_abbr` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`state_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.states: ~51 rows (approximately)
REPLACE INTO `states` (`state_id`, `state_name`, `state_abbr`) VALUES
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

-- Dumping structure for table jrtdesig_stagewrite.users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.users: ~35 rows (approximately)
REPLACE INTO `users` (`user_id`, `password_hash`, `email`, `first_name`, `last_name`, `role_id`, `created_at`, `is_active`) VALUES
	('01605b3c-fe88-11ef-b270-ac1f6bd8cd8c', '$2y$10$Kxr0hyaQb.zLfrN5Hj8bTeNRKivvNa.gjEFEQyGHqQal8oyuGgx9W', 'adalie.marie@gmail.com', 'Addie', 'Thomas', 2, '2025-03-11 14:49:03', 1),
	('1d0a4f46-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin1@admin.com', 'Jane', 'Smith', 1, '2025-02-01 16:25:11', 0),
	('1d0a4fe7-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin2@admin.com', 'Michael', 'Johnson', 2, '2025-02-01 16:25:11', 1),
	('1d0b4301-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member1@example.com', 'Emily', 'Brown', 2, '2025-02-01 16:25:11', 0),
	('1d0b4484-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member2@example.com', 'David', 'Williams', 1, '2025-02-01 16:25:11', 1),
	('1d0b44f3-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member3@example.com', 'Sarah', 'Jones', 1, '2025-02-01 16:25:11', 1),
	('1d0b4542-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member4@example.com', 'James', 'Garcia', 1, '2025-02-01 16:25:11', 1),
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
	('1d0b4d3c-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member28@example.com', 'Donald', 'Green', 1, '2025-02-01 16:25:11', 1),
	('1d0b4d83-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member29@example.com', 'Dorothy', 'Baker', 1, '2025-02-01 16:25:11', 0),
	('1d0b4dc9-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member30@example.com', 'Paul', 'Adams', 2, '2025-02-01 16:25:11', 1),
	('1d0b4e17-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member31@example.com', 'Sandra', 'Nelson', 1, '2025-02-01 16:25:11', 1),
	('1d0b4e66-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member32@example.com', 'Steven', 'Carter', 1, '2025-02-01 16:25:11', 1),
	('1d0b4f03-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member34@example.com', 'Kimberly', 'Perez', 1, '2025-02-01 16:25:11', 1),
	('21968a72-0848-11f0-93b0-0a0027000006', '$2y$10$gKgtRzKJjVanNqG.43nmFOv6WkKyZEzEVF.4tGhJ0TMyBkEdHFHtW', 'TWO@gmail.com', 'TWO', 'TWO', 1, '2025-03-24 00:37:14', 1),
	('25869af1-084e-11f0-93b0-0a0027000006', '$2y$10$F/MgWa7sZU.YngCRYlO9tuNObZbiTJCSndGkrkIOe23gB06g4nJcq', 'THREE@gmail.com', 'THREE', 'THREE', 1, '2025-03-24 01:20:17', 1),
	('2a751dc2-084f-11f0-93b0-0a0027000006', '$2y$10$7oqudtXiOVfdYFFglVBF4.44bi1G6cLM6Cmzuuoh./Z554Mbht0ce', 'FOUR@gmail.com', 'FOUR', 'FOUR', 1, '2025-03-24 01:27:35', 1),
	('6277c8a9-fe98-11ef-b270-ac1f6bd8cd8c', '$2y$10$eJy0mUvMyfgPlz9KjZMgX.G8o5liATif6hjzwlEOaBauawDG7D9c.', 'Testtest@gmail.com', 'test', 'last', 1, '2025-03-11 16:46:18', 1),
	('7912f77d-fd1f-11ef-b270-ac1f6bd8cd8c', '$2y$10$mxRPu29c6RbfnGhNrZVYSe8K7Yg1RY8GcxEZykHujIXssU.kZ0mX6', 'qwe@asd.com', 'qwe', 'qwe', 1, '2025-03-09 19:48:17', 0),
	('840b812e-ec97-11ef-bb3f-0a0027000006', '$2y$10$MXsbfRNyNc.0lKulbprB0etMUA7nq6JYFByPHscuiXCbGbU3UcKNG', 'joeblow@gmail.com', 'Joe', 'Blow', 3, '2025-02-16 18:54:57', 1),
	('ab54fed4-fd02-11ef-b141-0a0027000006', '$2y$10$ApvmDH9Z67h9x29FwM8rh.qXQLa2SqdJyGWEty8DIdRBcl/QRg2G6', 'TestyTest@test.com', 'Testy', 'McTest', 1, '2025-03-09 16:22:17', 1),
	('ce59b525-fe2a-11ef-b270-ac1f6bd8cd8c', '$2y$10$MbLuzPeycQaiDZge2vdweu/d1osaunP1M/9xywSnMPl7eLqYa5CKa', 'user@test.com', 'Kevin', 'Franklin', 1, '2025-03-11 03:41:54', 1),
	('df2ceefe-0841-11f0-99e3-0a0027000006', '$2y$10$J2crSUxi2qCcU0UzMug5fuUCdsO9K7RPD2NXk4VRtwfZmAezb76Ru', 'BARF1234@gmail.com', 'Barf', 'McGee', 1, '2025-03-23 23:52:25', 1),
	('fc5e35a4-fe71-11ef-b270-ac1f6bd8cd8c', '$2y$10$BPidut5VXijRcr0A6AqGC.3/xTzU8tfWkGgD08PvThNj.2HysNEjC', 'ashleerollice@students.abtech.edu', 'Ashlee ', 'Rollice', 1, '2025-03-11 12:11:25', 1);

-- Dumping structure for table jrtdesig_stagewrite.user_favorites
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `favorite_id` int NOT NULL AUTO_INCREMENT,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `element_id` int NOT NULL,
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `user_element` (`user_id`,`element_id`),
  KEY `fk_favorites_element` (`element_id`),
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_favorites_element` FOREIGN KEY (`element_id`) REFERENCES `elements` (`element_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=601 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.user_favorites: ~9 rows (approximately)
REPLACE INTO `user_favorites` (`favorite_id`, `user_id`, `element_id`) VALUES
	(128, '1d0b4301-e0b9-11ef-8f29-ac1f6bd8cd8c', 1),
	(205, '1d0b4851-e0b9-11ef-8f29-ac1f6bd8cd8c', 2),
	(154, '1d0b4cf5-e0b9-11ef-8f29-ac1f6bd8cd8c', 2),
	(522, '21968a72-0848-11f0-93b0-0a0027000006', 1),
	(538, '25869af1-084e-11f0-93b0-0a0027000006', 2),
	(524, '2a751dc2-084f-11f0-93b0-0a0027000006', 2),
	(596, '840b812e-ec97-11ef-bb3f-0a0027000006', 1),
	(520, 'df2ceefe-0841-11f0-99e3-0a0027000006', 1),
	(519, 'df2ceefe-0841-11f0-99e3-0a0027000006', 2);

-- Dumping structure for table jrtdesig_stagewrite.user_roles
CREATE TABLE IF NOT EXISTS `user_roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.user_roles: ~3 rows (approximately)
REPLACE INTO `user_roles` (`role_id`, `role_name`) VALUES
	(1, 'member'),
	(2, 'admin'),
	(3, 'super_admin');

-- Dumping structure for table jrtdesig_stagewrite.user_venues
CREATE TABLE IF NOT EXISTS `user_venues` (
  `user_venue_id` int NOT NULL AUTO_INCREMENT,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_street` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_state_id` int DEFAULT NULL,
  `venue_zip` char(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage_depth` int DEFAULT NULL,
  `stage_width` int DEFAULT NULL,
  PRIMARY KEY (`user_venue_id`) USING BTREE,
  KEY `venue_city` (`venue_city`) USING BTREE,
  KEY `venue_state_id` (`venue_state_id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  CONSTRAINT `fk_user_venues_state` FOREIGN KEY (`venue_state_id`) REFERENCES `states` (`state_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_venues_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.user_venues: ~12 rows (approximately)
REPLACE INTO `user_venues` (`user_venue_id`, `user_id`, `venue_name`, `venue_street`, `venue_city`, `venue_state_id`, `venue_zip`, `stage_depth`, `stage_width`) VALUES
	(1, '840b812e-ec97-11ef-bb3f-0a0027000006', 'New Venue From Member Test - Name only', NULL, NULL, NULL, NULL, NULL, NULL),
	(3, '840b812e-ec97-11ef-bb3f-0a0027000006', 'New Venue From Member Test - Full Info', '54 Danielwood Ct', 'Clyde', 1, '28721', 100, 50),
	(4, '840b812e-ec97-11ef-bb3f-0a0027000006', 'Test Again', NULL, NULL, NULL, NULL, NULL, NULL),
	(5, '21968a72-0848-11f0-93b0-0a0027000006', 'ONE', NULL, NULL, NULL, NULL, 50, 100),
	(6, '21968a72-0848-11f0-93b0-0a0027000006', '123', NULL, NULL, NULL, NULL, NULL, NULL),
	(7, '21968a72-0848-11f0-93b0-0a0027000006', 'aasd', NULL, NULL, NULL, NULL, NULL, NULL),
	(8, '21968a72-0848-11f0-93b0-0a0027000006', 'fsdfsf', NULL, NULL, NULL, NULL, NULL, NULL),
	(9, '25869af1-084e-11f0-93b0-0a0027000006', 'THREE', NULL, NULL, NULL, NULL, 50, 100),
	(10, '25869af1-084e-11f0-93b0-0a0027000006', 'FOUR', NULL, NULL, NULL, NULL, 50, 100),
	(11, '25869af1-084e-11f0-93b0-0a0027000006', 'FIVE', NULL, NULL, NULL, NULL, NULL, NULL),
	(12, '2a751dc2-084f-11f0-93b0-0a0027000006', 'ONE', NULL, NULL, NULL, NULL, NULL, NULL),
	(13, '2a751dc2-084f-11f0-93b0-0a0027000006', 'TWO', NULL, NULL, NULL, NULL, NULL, NULL),
	(14, '2a751dc2-084f-11f0-93b0-0a0027000006', 'THREE', NULL, NULL, NULL, NULL, 23, 122),
	(15, '840b812e-ec97-11ef-bb3f-0a0027000006', 'TEST TEST TEST TEST', NULL, NULL, NULL, NULL, NULL, NULL);

-- Dumping structure for table jrtdesig_stagewrite.venues
CREATE TABLE IF NOT EXISTS `venues` (
  `venue_id` int NOT NULL AUTO_INCREMENT,
  `venue_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_street` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `venue_state_id` int NOT NULL,
  `venue_zip` char(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_depth` int NOT NULL,
  `stage_width` int NOT NULL,
  PRIMARY KEY (`venue_id`),
  KEY `venue_city` (`venue_city`),
  KEY `venue_state_id` (`venue_state_id`),
  CONSTRAINT `fk_venues_state` FOREIGN KEY (`venue_state_id`) REFERENCES `states` (`state_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table jrtdesig_stagewrite.venues: ~23 rows (approximately)
REPLACE INTO `venues` (`venue_id`, `venue_name`, `venue_street`, `venue_city`, `venue_state_id`, `venue_zip`, `stage_depth`, `stage_width`) VALUES
	(2, 'The Orange Peel', '101 Biltmore Ave', 'Asheville', 1, '28801', 45, 45),
	(3, 'Lincoln Theatre', '126 E Cabarrus St', 'Raleigh', 1, '27601', 25, 35),
	(4, 'Neighborhood Theatre', '511 E 36th St', 'Charlotte', 1, '28205', 28, 42),
	(5, 'The Fillmore', '820 Hamilton St', 'Charlotte', 1, '28206', 35, 45),
	(6, 'The Ritz', '2820 Industrial Dr', 'Raleigh', 1, '27609', 32, 48),
	(7, 'Music Farm', '32 Ann St', 'Charleston', 2, '29403', 24, 36),
	(8, 'Township Auditorium', '1703 Taylor St', 'Columbia', 2, '29201', 40, 60),
	(9, 'Peace Center', '300 S Main St', 'Greenville', 2, '29601', 50, 100),
	(10, 'House of Blues', '4640 Hwy 17 S', 'Myrtle Beach', 2, '29582', 30, 50),
	(11, 'The Senate', '1022 Senate St', 'Columbia', 2, '29201', 26, 38),
	(12, 'Ground Zero', '904 S Main St', 'Anderson', 2, '29624', 20, 30),
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
	(25, 'Cat\'s Cradle', '300 E Main St', 'Carrboro', 1, '27510', 22, 38);

-- Dumping structure for trigger jrtdesig_stagewrite.before_insert_users
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER `before_insert_users` BEFORE INSERT ON `users` FOR EACH ROW BEGIN
  IF NEW.user_id IS NULL THEN
    SET NEW.user_id = UUID();
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
