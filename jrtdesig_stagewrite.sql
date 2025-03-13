-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 13, 2025 at 02:06 PM
-- Server version: 10.6.20-MariaDB-cll-lve
-- PHP Version: 8.3.15

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

-- --------------------------------------------------------

--
-- Table structure for table `elements`
--

CREATE TABLE `elements` (
  `element_id` int(11) NOT NULL,
  `element_name` varchar(20) NOT NULL,
  `category_id` int(11) NOT NULL,
  `element_image` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `elements`
--

INSERT INTO `elements` (`element_id`, `element_name`, `category_id`, `element_image`) VALUES
(1, 'Drum Kit', 3, 'drum-kit.jpg'),
(2, 'Electric Guitar', 3, 'electric-guitar.png');

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
(2, 'Microphones'),
(3, 'Instruments'),
(4, 'Amplifiers'),
(5, 'Lighting'),
(6, 'Staging'),
(7, 'Monitors'),
(8, 'Effects'),
(9, 'Cables'),
(10, 'Personnel');

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
  `rotation` float NOT NULL DEFAULT 0,
  `flipped` tinyint(1) NOT NULL DEFAULT 0,
  `z_index` int(11) NOT NULL,
  `label` varchar(10) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `saved_plots`
--

CREATE TABLE `saved_plots` (
  `plot_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `plot_name` varchar(20) NOT NULL,
  `event_date_start` datetime NOT NULL,
  `event_date_end` datetime NOT NULL,
  `venue_id` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
('1d0a4f46-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin1@admin.com', 'Jane', 'Smith', 1, '2025-02-01 16:25:11', 0),
('1d0a4fe7-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin2@admin.com', 'Michael', 'Johnson', 2, '2025-02-01 16:25:11', 1),
('1d0b4301-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member1@example.com', 'Emily', 'Brown', 2, '2025-02-01 16:25:11', 1),
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
('1d0b4d83-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member29@example.com', 'Dorothy', 'Baker', 1, '2025-02-01 16:25:11', 1),
('1d0b4dc9-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member30@example.com', 'Paul', 'Adams', 2, '2025-02-01 16:25:11', 1),
('1d0b4e17-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member31@example.com', 'Sandra', 'Nelson', 1, '2025-02-01 16:25:11', 1),
('1d0b4e66-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member32@example.com', 'Steven', 'Carter', 1, '2025-02-01 16:25:11', 1),
('1d0b4f03-e0b9-11ef-8f29-ac1f6bd8cd8c', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'member34@example.com', 'Kimberly', 'Perez', 1, '2025-02-01 16:25:11', 1),
('6277c8a9-fe98-11ef-b270-ac1f6bd8cd8c', '$2y$10$eJy0mUvMyfgPlz9KjZMgX.G8o5liATif6hjzwlEOaBauawDG7D9c.', 'Testtest@gmail.com', 'test', 'last', 1, '2025-03-11 16:46:18', 1),
('7912f77d-fd1f-11ef-b270-ac1f6bd8cd8c', '$2y$10$mxRPu29c6RbfnGhNrZVYSe8K7Yg1RY8GcxEZykHujIXssU.kZ0mX6', 'qwe@asd.com', 'qwe', 'qwe', 1, '2025-03-09 19:48:17', 1),
('840b812e-ec97-11ef-bb3f-0a0027000006', '$2y$10$MXsbfRNyNc.0lKulbprB0etMUA7nq6JYFByPHscuiXCbGbU3UcKNG', 'joeblow@gmail.com', 'Joe', 'Blow', 3, '2025-02-16 18:54:57', 1),
('ab54fed4-fd02-11ef-b141-0a0027000006', '$2y$10$ApvmDH9Z67h9x29FwM8rh.qXQLa2SqdJyGWEty8DIdRBcl/QRg2G6', 'TestyTest@test.com', 'Testy', 'McTest', 1, '2025-03-09 16:22:17', 1),
('ce59b525-fe2a-11ef-b270-ac1f6bd8cd8c', '$2y$10$MbLuzPeycQaiDZge2vdweu/d1osaunP1M/9xywSnMPl7eLqYa5CKa', 'user@test.com', 'Kevin', 'Franklin', 1, '2025-03-11 03:41:54', 1),
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
(154, '1d0b4cf5-e0b9-11ef-8f29-ac1f6bd8cd8c', 2);

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
-- Table structure for table `venues`
--

CREATE TABLE `venues` (
  `venue_id` int(11) NOT NULL,
  `venue_name` varchar(100) NOT NULL,
  `venue_street` varchar(100) DEFAULT NULL,
  `venue_city` varchar(100) DEFAULT NULL,
  `venue_state_id` int(11) DEFAULT NULL,
  `venue_zip` char(5) DEFAULT NULL,
  `stage_depth` int(11) NOT NULL,
  `stage_width` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `venues`
--

INSERT INTO `venues` (`venue_id`, `venue_name`, `venue_street`, `venue_city`, `venue_state_id`, `venue_zip`, `stage_depth`, `stage_width`) VALUES
(1, 'New Venue', NULL, NULL, NULL, NULL, 40, 60),
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
(25, 'Cat\'s Cradle', '300 E Main St', 'Carrboro', 1, '27510', 22, 38),
(26, 'Big Testies Sound Test', '123 Test', 'Testfield', 42, '12345', 25, 50);

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
  ADD KEY `venue_id` (`venue_id`);

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
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `placed_elements`
--
ALTER TABLE `placed_elements`
  MODIFY `placed_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=431;

--
-- AUTO_INCREMENT for table `plot_inputs`
--
ALTER TABLE `plot_inputs`
  MODIFY `input_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=254;

--
-- AUTO_INCREMENT for table `saved_plots`
--
ALTER TABLE `saved_plots`
  MODIFY `plot_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `states`
--
ALTER TABLE `states`
  MODIFY `state_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `user_favorites`
--
ALTER TABLE `user_favorites`
  MODIFY `favorite_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=229;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `venues`
--
ALTER TABLE `venues`
  MODIFY `venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `elements`
--
ALTER TABLE `elements`
  ADD CONSTRAINT `fk_elements_category` FOREIGN KEY (`category_id`) REFERENCES `element_categories` (`category_id`);

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
  ADD CONSTRAINT `fk_saved_plots_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_saved_plots_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`venue_id`);

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
-- Constraints for table `venues`
--
ALTER TABLE `venues`
  ADD CONSTRAINT `fk_venues_state` FOREIGN KEY (`venue_state_id`) REFERENCES `states` (`state_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
