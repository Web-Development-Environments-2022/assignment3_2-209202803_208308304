const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");



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
    return await axios.get(`${api_domain}/informationBulk`, {
        params: {
            ids: recipes_id_array.values, //TODO test the .values()
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}
async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let {id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        recipe_id: id,
        image: image,
        title: title,
        readyInMinutes: readyInMinutes,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree
    }
}

async function getFullRecipe(recipe_id){
    let recipe_info = await getRecipeInformation(recipe_id);
    let {id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, servings, extendedIngredients, analyzedInstructions } = recipe_info.data;
    ingredients = [];
    for(let i =0; i<extendedIngredients.length; i++){
        ingredient_details = {
            name: extendedIngredients[i].name,
            amount: extendedIngredients[i].amount,
            metric: extendedIngredients[i].unit
        }
        ingredients.push(ingredient_details)
    }
    return {
        recipe_id: id,
        image: image,
        title: title,
        readyInMinutes: readyInMinutes,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        servings_amount: servings,
        Ingredients: ingredients,
        Instructions: analyzedInstructions //filter?
    }
}

async function getAllPreview(user_id, recipes_id_array){
    let recipes_array = [];
    let recipesIdFromApi = [];
    let recipesIdFromDB = [];
    for(let i=0; i<recipes_id_array.length; i++){
        let recipe_id = recipes_id_array[i];
        if(typeof (recipe_id) == number){
            recipesIdFromApi.push(recipe_id)
        }
        else{
            recipesIdFromDB.push(recipe_id);
        }
    }
    user_recipesDB = getRecipesPreviewFromDB(user_id, recipesIdFromDB) // get preview for all myrecipes by user_id
	user_recipesAPI = getRecipesPreviewFromAPI(user_id, recipesIdFromApi) //get preview for API recipes
    let j=0;
    let k=0;
    for (let i=0; i<recipes_id_array.length; i++){
        if(j<user_recipesDB.length && recipes_id_array[i]===user_recipesDB[j].recipe_id){
            recipes_array.push(user_recipesDB[j]);
            j++;
        }
        else if(k<user_recipesAPI.length && recipes_id_array[i]===user_recipesDB[k].recipe_id){
            recipes_array.push(user_recipesDB[k]);
            k++;
        }
    }
    return recipes_array;
}

async function checkIfUserFavorite(user_id, recipe_id){
    user_fav = await DButils.execQuery(`SELECT recipe_id from FavoriteRecipes WHERE user_id = '${user_id}'`);
    if (user_fav.find((x) => x.recipe_id === recipe_id))
        return true;
    return false;
}

async function checkIfUserWatched(user_id, recipe_id){
    user_watch = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}'`);
    if (user_watch.find((x) => x.recipe_id === recipe_id))
        return true;
    return false;
}

async function getRandomRecipes(user_id){
    let random_recipes =  await axios.get(`${api_domain}/recipes/random`, {
        params: {
            number: 3,
        }
    });
    let recipes_array = [];
    let recipe_details = {};
    for(let i=0; i<3; i++){
        let recipe_id = random_recipes[i];
        if(typeof (recipe_id) == number){
            let {id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = random_recipes[i].data;
            recipe_details ={
                recipe_id: id,
                image: image,
                title: title,
                readyInMinutes: readyInMinutes,
                popularity: aggregateLikes,
                vegan: vegan,
                vegetarian: vegetarian,
                glutenFree: glutenFree
            }
        }
        recipe_details['isFavorite']=checkIfUserFavorite(user_id, recipe_id);
        recipe_details['isWatched']=checkIfUserWatched(user_id, recipe_id);
        recipes_array.push(recipe_details);
    }
    return recipes_array;
}

async function getUserLastWatched(user_id){
    user_last_watched = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}' ORDER BY last_watched_time LIMIT 3`);
    user_last_watched_preview = await getAllPreview(user_id, user_last_watched);
    return user_last_watched_preview;
}

async function getAllUserRecipes(user_id){
    const recipes_details = await DButils.execQuery(`select recipe_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, ingredients, instructions, servings_amount
    from user_recipes where user_id='${user_id}'`);
    return recipes_details;
}


async function getRecipesPreviewFromDB(user_id, recipes_id_array){
    let user_recipes = await getAllUserRecipes(user_id);
    let sub_recipes = [];
    for(var i=0; i<user_recipes.length; i++){
        if(recipes_id_array.includes(user_recipes[i].recipe_id)){ //TODO see the .recipe_id
            //TODO check favorites, check watched, add values to list,
            sub_recipes.push(user_recipes[i]);
        }
    }
    return sub_recipes;
}

exports.getRecipeDetails = getRecipeDetails;
exports.getAllPreview = getAllPreview;
exports.getFullRecipe = getFullRecipe;
exports.getRandomRecipes = getRandomRecipes;
exports.getUserLastWatched = getUserLastWatched;
exports.getRecipesPreviewFromDB = getRecipesPreviewFromDB;
exports.getAllUserRecipes = getAllUserRecipes;
exports.getRecipeInformationBulk = getRecipeInformationBulk;