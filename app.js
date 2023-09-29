//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { isBuffer } = require("util");
const _= require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:admin@cluster0.qb3fibb.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to our todolist!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item"
})

const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


// Item.insertMany(defaultItems)
//   .then(function () {
//     console.log("Successfully saved defult items to DB");
//   }).catch(function (err) {
//     console.log(err);
//   });

app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find();
    console.log(foundItems);
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems)
        .then(function () {
            console.log("Successfully saved defult items to DB");
        }).catch(function (err) {
            console.log(err);
        });
        res.render("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName})
  .then(foundList => {

    if (!foundList) {

      //Create a new List
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      //Show an existing List
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  })
  .catch(err => {
    console.log(err);
  });
})

//Add an new item
app.post("/", function(req, res){
  
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
  .then(foundList => {
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  })
  .catch(err => {
    console.log(err);
  });
  }
  
});
//Delete an item
app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
  
      console.log("Successfully deleted checked item");
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}})
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.log(err);
      });
  }
  
})
// app.post("/delete", function(req, res){
//   const checkedItemId = req.body.checkbox;

//   Item.findByIdAndRemove(checkedItemId, function(err) {
//     if(!err) {
//       console.log("Successfully deleted checked item");
//       res.redirect("/");
//     }
//   })
// })


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
