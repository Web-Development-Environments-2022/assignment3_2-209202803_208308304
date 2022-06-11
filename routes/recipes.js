var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("./utils/DButils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    const user_id = req.session.user_id;
    await DButils.execQuery(
      `INSERT INTO WatchedRecipes VALUES ('${user_id}', '${req.params.recipeId}')`
    );
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
