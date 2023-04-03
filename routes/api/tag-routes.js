const router = require('express').Router();
const { Tag, Product, ProductTag, Category } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data

  try {
    // Get all tags from the database including the associated products saved in ProductTag table
    const allTags = await Tag.findAll({
      include: [{
        model: Product,
        through: ProductTag, // ProductTag based association
        as: 'products', // Name of the product list in tags
        include: [{ model: Category }] // Additional information for the associated products.
      }],
    });
    res.status(200).json(allTags);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data

  try {
    const tag = await Tag.findByPk(req.params.id, {
      include: [{
        model: Product,
        through: ProductTag,
        as: 'products',
        include: [{ model: Category }]
      }]
    });
    if (tag) {
      res.json(tag);
    } else {
      res.status(404).json({ message: 'No tag with that id found!' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  // create a new tag
  /* req.body should look like this...
    {
      tag_name: "Magenta"
      productIds: [1, 2, 3, 4]
    }
  */

  Tag.create(req.body)
    .then((tag) => {
      if (req.body.productIds && typeof req.body.productIds == "object") {
        if (req.body.productIds.length) {
          const productTagIdArr = req.body.productIds.map((product_id) => {
            return {
              product_id: product_id,
              tag_id: tag.id,
            };
          });
          return ProductTag.bulkCreate(productTagIdArr);
        }
      }
      res.status(200).json(tag);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.put('/:id', async (req, res) => {
  // update a tag's name by its `id` value
  /* req.body should look like this...
    {
      tag_name: "Magenta"
      productIds: [1, 2, 3, 4]
    }
  */
  try {
    const updateTag = await Tag.update(req.body, {
      where: { id: req.params.id }
    });
    if (updateTag[0]) {
      if (req.body.productIds && typeof req.body.productIds == "object") {
        if (req.body.productIds.length) {
          const productTagIdArr = req.body.productIds.map((product_id) => {
            return {
              product_id: product_id,
              tag_id: req.params.id,
            };
          });
          ProductTag.destroy({
            where: { tag_id: req.params.id },
          });
          const productTags = await ProductTag.bulkCreate(productTagIdArr);
          res.status(200).json(productTags) ;
          return;
        }
      }
      res.status(200).json(updateTag);
    } else {
      res.status(404).json({ message: 'No tag with that id found!' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value

  try {
    const deleteTag = await Tag.destroy({
      where: { id: req.params.id },
    });

    if (deleteTag) {
      const deleteProductTag = await ProductTag.destroy({
        where: { tag_id: req.params.id },
      });
      if(deleteProductTag){
        res.status(200).json(deleteProductTag);
      }else{
        res.status(200).json(deleteTag);
      }
    }else{
      res.status(404).json({ message: 'No tag with that id found!' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
