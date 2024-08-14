options(scipen = 999)             # Modify global options in R

# Install Packages, Load Libraries ----
packages_required <- c("tidyverse",   ## List of required packages
                       "readxl", 
                       "Microsoft365R",
                       "glue", 
                       "ggtext", 
                       "devtools",
                       "treemap",
                       "treemapify",
                       "knitr",
                       "zoo",
                       "lubridate",
                       "data.table",
                       "vroom",
                       "readr",
                       "stringr",
                       "janitor") # rename columns to snake case


new_packages <- packages_required[!(packages_required %in% installed.packages()[,"Package"])] ## List of packages to be installed

if(length(new_packages)) install.packages(new_packages) ## Install packages if necessary

lapply(packages_required, library, character.only = TRUE) ## Load libraries if necessary

# Set Directory, Clear Console and Environment ----
rm(list = ls()) # Clear environment

cat("\014") # Clear console

setwd("/Users/georgenafalzon/Documents/DATASETS/Noise Solution")

# Load data ----
data <- read_xls("Noise+Solution+VFSG+report+FINAL+July+24.xls")

# Clean data ----

# convert column names to snake case
data <- clean_names(data)

# subset for rows with external member comments/likes/posts interactions

data_story_interactions <- data %>%
  filter(external_members != 0)


# QUESTION: Do increasing SWEMWBS scores correlate with number of COMMENTS? (NO) ----

# compute new column for score change
data_story_interactions$score_change <- data_story_interactions$swemwbs_end_score - data_story_interactions$swemwbs_start_score

# Explore the data
summary(data_story_interactions)

# Check for summary statistics
hist(data_story_interactions$likes, main = "Histogram of Likes", xlab = "Likes")
hist(data_story_interactions$score_change, main = "Histogram of Score Change", xlab = "Score Change")

# Perform correlation analysis
correlation <- cor(data_story_interactions$likes, data_story_interactions$score_change)
print(paste("Correlation between likes and score change:", correlation))

# isualize the relationship
plot(data_story_interactions$likes, data_story_interactions$score_change, 
     main = "Scatter Plot of Likes vs Score Change",
     xlab = "Number of Likes",
     ylab = "Score Change",
     pch = 19, col = "blue")

# Perform linear regression (optional)
model <- lm(score_change ~ likes, data = data_story_interactions)
summary(model)

# QUESTION: Do increasing SWEMWBS scores correlate with number of COMMENTS? (NO) ----

# Perform correlation analysis
correlation <- cor(data_story_interactions$comments, data_story_interactions$score_change)
print(paste("Correlation between comments and score change:", correlation))

# Visualize the relationship
plot(data_story_interactions$comments, data_story_interactions$score_change, 
     main = "Scatter Plot of Comments vs Score Change",
     xlab = "Number of Comments",
     ylab = "Score Change",
     pch = 19, col = "blue")

# QUESTION: Do increasing SWEMWBS scores correlate with number of POSTS? (not really) ----

# Perform correlation analysis
correlation <- cor(data_story_interactions$posts, data_story_interactions$score_change)
print(paste("Correlation between posts and score change:", correlation))

# Visualize the relationship
plot(data_story_interactions$posts, data_story_interactions$score_change, 
     main = "Scatter Plot of Posts vs Score Change",
     xlab = "Number of Comments",
     ylab = "Score Change",
     pch = 19, col = "blue")

