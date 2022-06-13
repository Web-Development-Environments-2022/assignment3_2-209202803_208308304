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
    recipes_ids = recipes_id_array.join(',');
    return await axios.get(`${api_domain}/informationBulk`, {
        params: {
            ids: recipes_ids, //TODO test the .values()
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

async function getRecipesPreviewFromAPI(recipes_id_array) {
    let recipe_info_array = await getRecipeInformationBulk(recipes_id_array);
    let recipe_preview_array = [];
    for(let i =0; i<recipes_id_array.length; i++){
        let {id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info_array.data[i];
        recipe_preview={
            recipe_id: id,
            image: image,
            title: title,
            readyInMinutes: readyInMinutes,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree
        }
        recipe_preview_array.push(recipe_preview);
    }
    return recipe_preview_array;
}

async function getFullRecipe(user_id, recipe_id){
    let recipe_info_full = {};
    if(recipe_id.includes("my")){
        recipe_info_full = await getMyRecipeFull(user_id,recipe_id)
    }
    else{
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
        recipe_info_full = {
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
    recipe_info_full = await addFavoriteAndWatched(user_id, [recipe_id], [recipe_info_full]);
    return recipe_info_full[0];
}



async function getAllPreview(user_id, recipes_id_array){
    let recipes_array = [];
    let recipesIdFromApi = [];
    let recipesIdFromDB = [];
    for(let i=0; i<recipes_id_array.length; i++){
        let recipe_id = recipes_id_array[i];
        if(recipe_id.includes("my")){
            recipesIdFromDB.push(recipe_id);;
        }
        else{
            recipesIdFromApi.push(recipe_id);
        }
    }
    user_recipesDB = await getRecipesPreviewFromDB(user_id, recipesIdFromDB) // get preview for all myrecipes by user_id
	user_recipesAPI = await getRecipesPreviewFromAPI(recipesIdFromApi) //get preview for API recipes
    let j=0;
    let k=0;
    for (let i=0; i<recipes_id_array.length; i++){
        if(j<recipesIdFromDB.length && recipes_id_array[i] == recipesIdFromDB[j]){
            recipes_array.push(user_recipesDB[j]);
            j++;
        }
        else if(k<recipesIdFromApi.length && recipes_id_array[i] == recipesIdFromApi[k]){
            recipes_array.push(user_recipesAPI[k]);
            k++;
        }
    }
    recipes_array = addFavoriteAndWatched(user_id, recipes_id_array, recipes_array);
    return recipes_array;
}

async function addFavoriteAndWatched(user_id, recipes_id_array, recipes_details_array){
    let user_fav_array = [];
    let user_watch_array = [];
    user_fav_dict = await getUserFavorite(user_id);
    user_watched_dict = await getUserWatched(user_id);
    user_fav_dict.map((element) => user_fav_array.push(element.recipe_id));
    user_watched_dict.map((element) => user_watch_array.push(element.recipe_id));
    for(let i=0; i<recipes_id_array.length; i++){
        recipes_details_array[i]['isFavorite'] = (user_fav_array.includes(recipes_id_array[i]));
        recipes_details_array[i]['isWatched'] = (user_watch_array.includes(recipes_id_array[i]));
    }
    return recipes_details_array;
}

async function getUserFavorite(user_id){
    user_fav = await DButils.execQuery(`SELECT recipe_id from FavoriteRecipes WHERE user_id = '${user_id}'`);
    return user_fav;
}

async function getUserWatched(user_id){
    user_watch = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}'`);
    return user_watch;
}

async function getRandomRecipes(user_id){
    let random_recipes =  await axios.get(`${api_domain}/random`, {
        params: {
            number: 3,
            apiKey: process.env.spooncular_apiKey
        }
    });
    let recipes_array = [];
    let recipes_id_array = [];
    let recipe_details = {};
    for(let i=0; i<3; i++){
        let {id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = random_recipes.data.recipes[i];
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
        recipes_id_array.push(id);
        recipes_array.push(recipe_details);
    }
    recipes_array = await addFavoriteAndWatched(user_id, recipes_id_array, recipes_array);
    return recipes_array;
}

async function getUserLastWatched(user_id){
    user_last_watched = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}' ORDER BY last_watched_time LIMIT 3`);
    user_last_watched_array = [];
    user_last_watched.map((element) => user_last_watched_array.push(element.recipe_id));
    //console.log(user_last_watched_array);
    user_last_watched_preview = await getAllPreview(user_id, user_last_watched_array);
    return user_last_watched_preview;
}

async function getMyRecipeFull(user_id, recipe_id){
    const recipe_full = await DButils.execQuery(`select recipe_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, ingredients, instructions, servings_amount
    from user_recipes where user_id='${user_id}' and recipe_id = '${recipe_id}'`);
    return recipe_full[0];
}

async function getAllMyRecipesPreview(user_id){
    const recipes_details = await DButils.execQuery(`select recipe_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree
    from user_recipes where user_id='${user_id}'`);
    return recipes_details;
}


async function getRecipesPreviewFromDB(user_id, recipes_id_array){
    let user_recipes_preview = await getAllMyRecipesPreview(user_id);
    let sub_recipes = [];
    for(var i=0; i<user_recipes_preview.length; i++){
        if(recipes_id_array.includes(user_recipes_preview[i].recipe_id)){ //TODO see the .recipe_id
            //TODO check favorites, check watched, add values to list,

            sub_recipes.push(user_recipes_preview[i]);
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
exports.getRecipesPreviewFromAPI = getRecipesPreviewFromAPI;
exports.getMyRecipeFull = getMyRecipeFull;
exports.getAllMyRecipesPreview = getAllMyRecipesPreview;