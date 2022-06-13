var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipes_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send({message: "The Recipe successfully saved as favorite", success: true});
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipes_utils.getAllPreview(user_id, recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


/**
 * This path gets body that contains all the details about the new recipe the logged-in user wants to create
 */
router.post('/myrecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let recipe_id = await user_utils.getNewRecipeId(user_id); //gets the id from the table
    let recipe_details = {
      title: req.body.title,
      image: req.body.image,
      readyInMinutes: req.body.readyInMinutes,
      popularity: req.body.popularity,
      vegan: req.body.vegan,
      vegetarian: req.body.vegetarian,
      glutenFree: req.body.glutenFree,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      servings: req.body.servings,
    }

    await DButils.execQuery(
      `INSERT INTO user_recipes VALUES ('${user_id}', '${recipe_id}', '${recipe_details.title}', '${recipe_details.image}',
      '${recipe_details.readyInMinutes}', '${recipe_details.popularity}', '${recipe_details.vegan}', '${recipe_details.vegetarian}', '${recipe_details.glutenFree}',
      '${recipe_details.ingredients}', '${recipe_details.instructions}', '${recipe_details.servings}')`
    );
    res.status(201).send({ message: "new recipe created", success: true });
  }catch(error){
    next(error);
  }
});

/**
 * This path returns the recipes that were created by the logged-in user
 */
router.get('/myrecipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const My_recipes = await recipes_utils.getAllUserRecipes(user_id);
    res.status(200).send(My_recipes);
  }catch(error){
    next(error);
  }
});


module.exports = router;