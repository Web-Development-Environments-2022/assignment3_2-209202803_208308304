const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");

async function markAsFavorite(user_id, recipe_id){
    user_fav = await DButils.execQuery(`SELECT recipe_id from FavoriteRecipes WHERE user_id = '${user_id}' and recipe_id = '${recipe_id}'`);
    if (user_fav.length == 0){
        recipe_id = recipe_id.toString();
        await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}','${recipe_id}')`);
    }
}

async function markAsWatched(user_id, recipe_id){
    let user_watch = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}' and recipe_id = '${recipe_id}'`);
    let local_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (user_watch.length==0) { 
        recipe_id = recipe_id.toString();
        await DButils.execQuery(`INSERT INTO WatchedRecipes VALUES ('${user_id}', '${recipe_id}', '${local_time}')`);
    }
    else {
        await DButils.execQuery(`UPDATE WatchedRecipes SET last_watched_time = '${local_time}' WHERE user_id = '${user_id}' and recipe_id = '${recipe_id}'`);
    }
}

async function checkIfRecipeIdExist(user_id, recipe_id){
    if(recipe_id.includes('my')){
        let recipe_id_array = await DButils.execQuery(`SELECT recipe_id from user_recipes WHERE user_id = '${user_id}' and recipe_id = '${recipe_id}'`);
        if (recipe_id_array.length == 0){
            return false;
        }
        return true;
    }
    else if(Number(recipe_id) == NaN){
        return false;
    }
    else if(Number(recipe_id) <1165540){
        return true;
    }
    return false;
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function getNewMyRecipeId(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from user_recipes where user_id='${user_id}'`);
    let recipes_count = recipes_id.length +1;
    return "my"+(recipes_count);
}

async function getNewFamilyRecipeId(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from family_recipes where user_id='${user_id}'`);
    let recipes_count = recipes_id.length +1;
    return "fa"+(recipes_count);
}

async function getAllMyRecipesPreview(user_id){
    const recipes_details = await DButils.execQuery(`select recipe_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree
    from user_recipes where user_id='${user_id}'`);
    recipes_details.map((element) => {
        element.vegan = element.vegan == 1;
        element.vegetarian = element.vegetarian == 1;
        element.glutenFree = element.glutenFree == 1;
    });
    return recipes_details;
}

async function changeToPreviewFormat(user_id, recipes_details){
    recipes_details.map((element) => {
        element.vegan = element.vegan == 1;
        element.vegetarian = element.vegetarian == 1;
        element.glutenFree = element.glutenFree == 1;
    });
    let my_recipe_preview_array = [];
    let my_recipes_ids_array = [];
    for(let i=0; i<recipes_details.length; i++){
        let recipe_preview = await recipes_utils.getRecipePreview(recipes_details[i]);
        let preview_details = {Preview: recipe_preview};
        my_recipe_preview_array.push(preview_details);
        my_recipes_ids_array.push(recipe_preview.recipe_id);
    }
    recipe_info_full = await recipes_utils.addFavoriteAndWatched(user_id, my_recipes_ids_array, my_recipe_preview_array);
    return my_recipe_preview_array;
}

async function getAllMyRecipesPreview(user_id){
    const recipes_details = await DButils.execQuery(`select recipe_id AS id, title, image, readyInMinutes, popularity AS aggregateLikes, vegan, vegetarian, glutenFree
    from user_recipes where user_id='${user_id}'`);
    let my_recipes_preview_array = await changeToPreviewFormat(user_id,recipes_details);
    return my_recipes_preview_array;
}

async function getAllFamilyRecipes(user_id){
    const recipes_details = await DButils.execQuery(`select recipe_id AS id, title, image, readyInMinutes, popularity AS aggregateLikes, vegan, vegetarian, glutenFree, owner, tradition,
    ingredients, instructions from family_recipes where user_id='${user_id}'`);
    recipes_details.map((element) => {
        element.vegan = element.vegan == 1;
        element.vegetarian = element.vegetarian == 1;
        element.glutenFree = element.glutenFree == 1;
        if(element.ingredients!="" && element.ingredients){
            element.ingredients = JSON.parse(element.ingredients);
        }
        else{
            element.ingredients =[];
        }
        if(element.instructions!="" && element.ingredients){
            element.instructions = JSON.parse(element.instructions);
        }
        else{
            element.instructions =[];
        }
    });
    return recipes_details;
}

exports.markAsFavorite = markAsFavorite;
exports.markAsWatched = markAsWatched;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getNewMyRecipeId = getNewMyRecipeId;
exports.getNewFamilyRecipeId = getNewFamilyRecipeId;
exports.checkIfRecipeIdExist = checkIfRecipeIdExist;
exports.getAllMyRecipesPreview = getAllMyRecipesPreview;
exports.getAllFamilyRecipes = getAllFamilyRecipes;