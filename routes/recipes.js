var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");
const DButils = require("./utils/DButils");

//router.get("/", (req, res) => res.send("im here"));

/**
 * This path returns a home page with 3 random recipes and 3 last watch if user is logged in
 */
 router.get("/", async (req, res, next) => {
   try {
    if(!req.session || !req.session.user_id){
      const user_id = -1;
    }
    else{
      const user_id = req.session.user_id;
    }
    const last_watched = await recipes_utils.getUserLastWatched(user_id)
    const random_recipes = await recipes_utils.getRandomRecipes(user_id);
    let home_recipes =[];
    home_recipes.push(random_recipes);
    home_recipes.push(last_watched);

    res.status(200).send(home_recipes);
   }
  catch (error) {
    next(error);
  }
 });


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getFullRecipe(req.params.recipeId);
    const user_id = req.session.user_id;
    await user_utils.markAsWatched(user_id,recipe.recipe_id);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
