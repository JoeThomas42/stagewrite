CREATE TABLE `users` (
  `user_id` uuid PRIMARY KEY,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(50) UNIQUE NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role_id` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL,
  `is_active` boolean NOT NULL DEFAULT 1
);

CREATE TABLE `user_roles` (
  `role_id` int PRIMARY KEY AUTO_INCREMENT,
  `role_name` varchar(20) NOT NULL
);

CREATE TABLE `venues` (
  `venue_id` int PRIMARY KEY AUTO_INCREMENT,
  `venue_name` varchar(100) NOT NULL,
  `venue_street` varchar(100),
  `venue_city` varchar(100),
  `venue_state_id` int,
  `venue_zip` char(5),
  `stage_depth` int NOT NULL,
  `stage_width` int NOT NULL
);

CREATE TABLE `states` (
  `state_id` int PRIMARY KEY AUTO_INCREMENT,
  `state_name` varchar(100) NOT NULL,
  `state_abbr` char(2)
);

CREATE TABLE `elements` (
  `element_id` int PRIMARY KEY AUTO_INCREMENT,
  `element_name` varchar(20) NOT NULL,
  `category_id` int NOT NULL,
  `element_image` varchar(20) NOT NULL
);

CREATE TABLE `element_categories` (
  `category_id` int PRIMARY KEY AUTO_INCREMENT,
  `category_name` varchar(50) NOT NULL
);

CREATE TABLE `saved_plots` (
  `plot_id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` uuid(10) NOT NULL,
  `plot_name` varchar(20) NOT NULL,
  `event_date_start` datetime NOT NULL,
  `event_date_end` datetime NOT NULL,
  `venue_id` int NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL
);

CREATE TABLE `user_favorites` (
  `favorite_id` int PRIMARY KEY,
  `user_id` uuid(10) NOT NULL,
  `element_id` int NOT NULL
);

CREATE TABLE `placed_elements` (
  `placed_id` int PRIMARY KEY,
  `element_id` int NOT NULL,
  `plot_id` int NOT NULL,
  `x_position` float NOT NULL,
  `y_position` float NOT NULL,
  `width` float NOT NULL,
  `height` float NOT NULL,
  `rotation` float NOT NULL DEFAULT 0,
  `flipped` boolean NOT NULL DEFAULT 0,
  `z_index` int NOT NULL,
  `label` varchar(10),
  `notes` text
);

CREATE TABLE `plot_inputs` (
  `input_id` int PRIMARY KEY AUTO_INCREMENT,
  `plot_id` int NOT NULL,
  `input_number` int NOT NULL AUTO_INCREMENT,
  `input_name` varchar(50) NOT NULL
);

CREATE INDEX `users_index_0` ON `users` (`email`);

CREATE INDEX `users_index_1` ON `users` (`role_id`);

CREATE INDEX `venues_index_2` ON `venues` (`venue_city`);

CREATE INDEX `elements_index_3` ON `elements` (`element_id`);

CREATE INDEX `saved_plots_index_4` ON `saved_plots` (`user_id`, `plot_name`);

CREATE INDEX `saved_plots_index_5` ON `saved_plots` (`venue_id`);

CREATE UNIQUE INDEX `user_favorites_index_6` ON `user_favorites` (`user_id`, `element_id`);

CREATE INDEX `placed_elements_index_7` ON `placed_elements` (`plot_id`);

CREATE INDEX `placed_elements_index_8` ON `placed_elements` (`plot_id`, `z_index`);

CREATE INDEX `plot_inputs_index_9` ON `plot_inputs` (`plot_id`, `input_number`);

ALTER TABLE `users` ADD FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`role_id`);

ALTER TABLE `venues` ADD FOREIGN KEY (`venue_state_id`) REFERENCES `states` (`state_id`);

ALTER TABLE `elements` ADD FOREIGN KEY (`category_id`) REFERENCES `element_categories` (`category_id`);

ALTER TABLE `saved_plots` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

ALTER TABLE `saved_plots` ADD FOREIGN KEY (`venue_id`) REFERENCES `venues` (`venue_id`);

ALTER TABLE `user_favorites` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

ALTER TABLE `user_favorites` ADD FOREIGN KEY (`element_id`) REFERENCES `elements` (`element_id`);

ALTER TABLE `placed_elements` ADD FOREIGN KEY (`element_id`) REFERENCES `elements` (`element_id`);

ALTER TABLE `placed_elements` ADD FOREIGN KEY (`plot_id`) REFERENCES `saved_plots` (`plot_id`);

ALTER TABLE `plot_inputs` ADD FOREIGN KEY (`plot_id`) REFERENCES `saved_plots` (`plot_id`);
