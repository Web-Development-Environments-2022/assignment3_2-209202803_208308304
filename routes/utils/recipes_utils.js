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



async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

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

async function getRecipesPreview(user_id, recipes_id_array){
    let favorite_recipes_array = [];
    user_fav = await DButils.execQuery(`SELECT recipe_id from FavoriteRecipes WHERE user_id = '${user_id}'`);
    user_watch = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}'`);
    for(let i=0; i<recipes_id_array.length; i++){
        let recipe_id = recipes_id_array[i];
        let result = await getRecipeDetails(recipe_id);
        result['isFavorite']=false;
        result['isWatched']=false;    
        if (user_fav.find((x) => x.recipe_id === recipe_id))
            result['isFavorite']=true;
        if (user_watch.find((x) => x.recipe_id === recipe_id))
            result['isWatched']=true;
        favorite_recipes_array.push(result);
    }
    return favorite_recipes_array;
}


exports.getRecipeDetails = getRecipeDetails;
exports.getRecipesPreview = getRecipesPreview;

