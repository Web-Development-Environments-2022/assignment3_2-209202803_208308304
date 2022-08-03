var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");
const DButils = require("./utils/DButils");

// router.get("/", (req, res) => res.send("im here"));

/**
 * This path returns a home page with 3 random recipes
 */
 router.get("/random", async (req, res, next) => {
   try {
     let user_id = -1;
      if(req.session && req.session.user_id){
        user_id = req.session.user_id;
      }
      const random_recipes = await recipes_utils.getRandomRecipes(user_id);
      res.status(200).send(random_recipes);
   }
  catch (error) {
    next(error);
  }
 });

 /**
 * This path returns 3 last watch if user is logged in
 */
  router.get("/watched", async (req, res, next) => {
    try {
      let user_id = -1;
      let last_watched = [];
       if(req.session && req.session.user_id){
         user_id = req.session.user_id;
         last_watched = await recipes_utils.getUserLastWatched(user_id);
       }
       res.status(200).send(last_watched);
    }
   catch (error) {
     next(error);
   }
  });

/**
 * This path returns a full details of a recipe by its id
 */
 router.put("/:recipeId", async (req, res, next) => {
  try {
    let user_id = -1;
    if (req.session && req.session.user_id) {
      user_id = req.session.user_id;
    }
    const exist = await user_utils.checkIfRecipeIdExist(user_id, req.params.recipeId);
    if(exist){
      const recipe = await recipes_utils.getFullRecipe(user_id, req.params.recipeId);
      if(user_id != -1){
        await user_utils.markAsWatched(user_id,req.params.recipeId); 
      }
      res.status(200).send(recipe);
    } else {
      res.status(404).send({message: "Recipe Not Found", success: false});
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;