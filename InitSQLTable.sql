CREATE TABLE users (
                       user_id int AUTO_INCREMENT PRIMARY KEY ,
                       username VARCHAR(255) NOT NULL,
                       firstname VARCHAR(255) NOT NULL,
                       lastname VARCHAR(255) NOT NULL,
                       country VARCHAR(255) NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       email VARCHAR(255) NOT NULL
);


CREATE TABLE FavoriteRecipes(
                    user_id int NOT NULL,
                    recipe_id VARCHAR(255) NOT NULL,
                    PRIMARY KEY(user_id, recipe_id)
);

CREATE TABLE WatchedRecipes(
                    user_id int NOT NULL,
                    recipe_id VARCHAR(255) NOT NULL,
                    last_watched_time datetime NOT NULL,
                    PRIMARY KEY(user_id, recipe_id)
);

CREATE TABLE user_recipes ( 
    user_id int NOT NULL,
    recipe_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    readyInMinutes INT NOT NULL,
    popularity INT NOT NULL,
    vegan BOOLEAN NOT NULL,
    vegetarian BOOLEAN NOT NULL,
    glutenFree BOOLEAN NOT NULL,
    ingredients TEXT(600) NOT NULL,
    instructions TEXT(600) NOT NULL,
    servings_amount INT NOT NULL,
    PRIMARY KEY(user_id, recipe_id)
)

CREATE TABLE family_recipes ( 
    user_id int NOT NULL,
    recipe_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    image VARCHAR(255) NOT NULL,
    readyInMinutes INT NOT NULL,
    popularity INT NOT NULL,
    vegan BOOLEAN NOT NULL,
    vegetarian BOOLEAN NOT NULL,
    glutenFree BOOLEAN NOT NULL,
    ingredients TEXT(600) NOT NULL,
    instructions TEXT(600) NOT NULL,
    servings_amount INT NOT NULL,
    owner  VARCHAR(255) NOT NULL,
    tradition TEXT(600) NOT NULL,
    PRIMARY KEY(user_id, recipe_id)
)