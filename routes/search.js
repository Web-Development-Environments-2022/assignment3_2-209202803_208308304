var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

/*
* This path returns the search result of a query with filters
*/
router.get('/', async (req, res, next) => {
  try {
    let user_id = -1;
    if(req.session && req.session.user_id){
      user_id = req.session.user_id;
    }
    let search_results = await recipes_utils.searchRecipes(user_id, req.query.query, req.query.numOfResults, req.query.cuisinesFilter, req.query.dietsFilter, req.query.intolerancesFilter,req.query.sortedBy,req.query.sortDirection);

    res.status(200).send(search_results);
  }
 catch (error) {
   next(error);
 }
});

module.exports = router ;