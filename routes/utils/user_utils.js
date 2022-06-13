const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    user_fav = await DButils.execQuery(`SELECT recipe_id from FavoriteRecipes WHERE user_id = '${user_id}' and recipe_id = '${recipe_id}'`);
    if (user_fav === null)
        await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
}

async function markAsWatched(user_id, recipe_id){
    let user_watch = await DButils.execQuery(`SELECT recipe_id from WatchedRecipes WHERE user_id = '${user_id}' and recipe_id = '${recipe_id}'`);
    let local_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (user_watch.length==0) { 
        await DButils.execQuery(`INSERT INTO WatchedRecipes VALUES ('${user_id}', '${recipe_id}', '${local_time}')`);
    }
    else {
        await DButils.execQuery(`UPDATE WatchedRecipes SET last_watched_time = '${local_time}' WHERE user_id = '${user_id}' and recipe_id = '${recipe_id}'`);
    }
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function getNewRecipeId(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from user_recipes where user_id='${user_id}'`);
    let recipes_count = recipes_id.length +1;
    return "my"+(recipes_count);
}


exports.markAsFavorite = markAsFavorite;
exports.markAsWatched = markAsWatched;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getNewRecipeId = getNewRecipeId;
