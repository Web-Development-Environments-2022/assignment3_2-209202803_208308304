const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
const user_utils = require("./user_utils");


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeInformationBulk(recipes_id_array) {
    recipes_ids = recipes_id_array.join(',');
    return await axios.get(`${api_domain}/informationBulk`, {
        params: {
            ids: recipes_ids, //TODO test the .values()
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}
// async function getRecipeDetails(recipe_id) {
//     let recipe_info = await getRecipeInformation(recipe_id);
//     let recipe_preview = await getRecipePreview(recipe_info.data);
//     return recipe_preview;

// }

async function getRecipePreview(recipe_details_dict) {
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_details_dict;
    let recipe_preview = {
        recipe_id: id.toString(),
        title: title,
        image: image,
        readyInMinutes: readyInMinutes,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree
    }
    return recipe_preview;
}

async function getRecipeFull(recipe_details_dict) {
    let recipe_preview = await getRecipePreview(recipe_details_dict);
    let { servings, extendedIngredients, analyzedInstructions } = recipe_details_dict;
    ingredients = [];
    instructions = [];
    for (let i = 0; i < extendedIngredients.length; i++) {
        ingredient_details = {
            name: extendedIngredients[i].name,
            amount: extendedIngredients[i].amount,
            metric: extendedIngredients[i].unit
        }
        ingredients.push(ingredient_details);
    }
    if (analyzedInstructions.length > 0) {
        let number=1;
        for (let j = 0;  j < analyzedInstructions.length; j++){
            for (let i = 0; i < analyzedInstructions[j].steps.length; i++) {
                instruction_details = {
                    number: number,
                    step: analyzedInstructions[0].steps[i].step
                }
                instructions.push(instruction_details);
                number++;
            }
        }

    }
    let recipe_info_full = {
        Preview: recipe_preview,
        servings: servings,
        ingredients: ingredients,
        instructions: instructions
    }
    return recipe_info_full;
}

async function getRecipesPreviewFromAPI(recipes_id_array) {
    let recipe_info_array = await getRecipeInformationBulk(recipes_id_array);
    let recipe_preview_array = [];
    for (let i = 0; i < recipes_id_array.length; i++) {
        let recipe_preview = await getRecipePreview(recipe_info_array.data[i]);
        let preview_details = { Preview: recipe_preview };
        recipe_preview_array.push(preview_details);
    }
    return recipe_preview_array;
}

async function getFullRecipe(user_id, recipe_id) {
    let recipe_full = {};
    if (recipe_id.includes("my")) {
        recipe_full = await getMyRecipeFull(user_id, recipe_id)
    }
    else {
        let recipe_info = await getRecipeInformation(recipe_id);
        recipe_full = await getRecipeFull(recipe_info.data);
    }
    recipe_info_full = await addFavoriteAndWatched(user_id, [recipe_id], [recipe_full]);
    return recipe_info_full[0];
}



async function getAllPreview(user_id, recipes_id_array) {
    let recipes_array = [];
    let recipesIdFromApi = [];
    let recipesIdFromDB = [];
    for (let i = 0; i < recipes_id_array.length; i++) {
        let recipe_id = recipes_id_array[i];
        if (recipe_id.includes("my")) {
            recipesIdFromDB.push(recipe_id);;
        }
        else {
            recipesIdFromApi.push(recipe_id);
        }
    }
    user_recipesDB = await getRecipesPreviewFromDB(user_id, recipesIdFromDB) // get preview for all myrecipes by user_id
    user_recipesAPI = await getRecipesPreviewFromAPI(recipesIdFromApi) //get preview for API recipes
    let j = 0;
    let k = 0;
    for (let i = 0; i < recipes_id_array.length; i++) {
        if (j < recipesIdFromDB.length && recipes_id_array[i] == recipesIdFromDB[j]) {
            recipes_array.push(user_recipesDB[j]);
            j++;
        }
        else if (k < recipesIdFromApi.length && recipes_id_array[i] == recipesIdFromApi[k]) {
            recipes_array.push(user_recipesAPI[k]);
            k++;
        }
    }
    recipes_array = addFavoriteAndWatched(user_id, recipes_id_array, recipes_array);
    return recipes_array;
}

async function addFavoriteAndWatched(user_id, recipes_id_array, recipes_details_array) {
    let user_fav_array = [];
    let user_watch_array = [];
    user_fav_dict = await getUserFavorite(user_id);
    user_watched_dict = await getUserWatched(user_id);
    user_fav_dict.map((element) => user_fav_array.push(element.recipe_id));
    user_watched_dict.map((element) => user_watch_array.push(element.recipe_id));
    for (let i = 0; i < recipes_id_array.length; i++) {
        recipes_details_array[i].Preview['isFavorite'] = (user_fav_array.includes(recipes_id_array[i]));
        recipes_details_array[i].Preview['isWatched'] = (user_watch_array.includes(recipes_id_array[i]));
    }
    return recipes_details_array;
}

async function getUserFavorite(user_id) {
    user_fav = await DButils.execQuery(`SELECT recipe_id from FavoriteRecipes WHERE user_id = '${user_id}'`);
    return user_fav;
}

async function getUserWatched(user_id) {
    user_watch = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}'`);
    return user_watch;
}

async function getRandomRecipes(user_id) {
    let random_recipes = await axios.get(`${api_domain}/random`, {
        params: {
            number: 3,
            apiKey: process.env.spooncular_apiKey
        }
    });
    let recipes_array = [];
    let recipes_id_array = [];
    for (let i = 0; i < 3; i++) {
        let recipe_preview = await getRecipePreview(random_recipes.data.recipes[i]);
        let preview_details = { Preview: recipe_preview };
        recipes_array.push(preview_details);
        recipes_id_array.push(recipe_preview.recipe_id);
    }
    recipes_array = await addFavoriteAndWatched(user_id, recipes_id_array, recipes_array);
    return recipes_array;
}

async function getUserLastWatched(user_id) {
    user_last_watched = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}' ORDER BY last_watched_time DESC LIMIT 3`);
    user_last_watched_array = [];
    user_last_watched.map((element) => user_last_watched_array.push(element.recipe_id));
    user_last_watched_preview = await getAllPreview(user_id, user_last_watched_array);
    num_of_recipes = user_last_watched.length;
    return user_last_watched_preview;
}

async function getMyRecipeFull(user_id, recipe_id) {
    const recipe_details = await DButils.execQuery(`select recipe_id AS id, title, image, readyInMinutes, popularity AS aggregateLikes, vegan, vegetarian, glutenFree, ingredients, instructions, servings
    from user_recipes where user_id='${user_id}' and recipe_id = '${recipe_id}'`);
    let recipe_preview = await getRecipePreview(recipe_details[0]);
    let ingredients = [];
    let instructions = [];
    if (recipe_details[0].ingredients != "")
        ingredients = JSON.parse(recipe_details[0].ingredients);
    if (recipe_details[0].instructions != "")
        instructions = JSON.parse(recipe_details[0].instructions);
    let recipe_full = {
        Preview: recipe_preview,
        servings: recipe_details[0].servings,
        ingredients: ingredients,
        instructions: instructions
    };
    return recipe_full;
}


async function getRecipesPreviewFromDB(user_id, recipes_id_array) {
    let user_recipes_preview = await user_utils.getAllMyRecipesPreview(user_id);
    let sub_recipes = [];
    for (let i = 0; i < recipes_id_array.length; i++) {
        for (let j = 0; j < user_recipes_preview.length; j++) {
            if (recipes_id_array[i] == (user_recipes_preview[j].Preview.recipe_id)) {
                sub_recipes.push(user_recipes_preview[j]);
            }
        }
    }
    return sub_recipes;
}

async function searchRecipes(user_id, query, numOfResults, cuisinesFilter, dietsFilter, intolerancesFilter) {
    let search_results = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: query,
            addRecipeInformation: true,
            fillIngredients: true,
            cuisine: cuisinesFilter,
            diet: dietsFilter,
            intolerances: intolerancesFilter,
            number: numOfResults,
            apiKey: process.env.spooncular_apiKey
        }
    });
    search_results_array = search_results.data.results;
    let recipes_id_array = [];
    let recipes_array = [];
    for (let i = 0; i < search_results_array.length; i++) {
        let recipe_full = await getRecipeFull(search_results_array[i]);
        recipes_array.push(recipe_full);
        recipes_id_array.push(recipe_full.Preview.recipe_id);
    }
    recipes_array = await addFavoriteAndWatched(user_id, recipes_id_array, recipes_array);
    return recipes_array;
}

exports.getAllPreview = getAllPreview;
exports.getFullRecipe = getFullRecipe;
exports.getRandomRecipes = getRandomRecipes;
exports.getUserLastWatched = getUserLastWatched;
exports.getMyRecipeFull = getMyRecipeFull;
exports.searchRecipes = searchRecipes;
exports.getRecipePreview = getRecipePreview;
exports.addFavoriteAndWatched = addFavoriteAndWatched;