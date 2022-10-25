//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.URI);

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({name: "Study web development"});

const item2 = new Item({name: "Drink water"});

const item3 = new Item({name: "Make breakfast"});

const defaultItems = [item1, item2, item3];

const ListSchema = new mongoose.Schema({

  name: String,
  items: [itemsSchema]

});

const List = mongoose.model("List", ListSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (err){

      console.log(err);

    } else if (foundItems.length === 0){

      Item.insertMany(defaultItems, function(err, docs){
        if (!err){
          console.log(docs);
        };
      });

      res.redirect("/");

    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    };
  });

});

app.get("/:listname", function(req, res){
  listname = _.capitalize(req.params.listname);

  List.findOne({name: listname}, function(err, list){
    if (!err) {
      if (list){

        res.render("list", {listTitle: list.name, newListItems: list.items});

      } else {

        const list = new List({name: listname, items: defaultItems});
        list.save();
        res.redirect("/" + listname);

      };
    };
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({name: itemName});

  if (listName === "Today"){

    newItem.save();
    res.redirect("/");

  } else {

    List.findOne({name: listName}, function(err, results){
      if (!err){
        results.items.push(newItem);
        results.save();
        res.redirect("/" + listName);
      };

    });

  };



});

app.post("/delete", function(req, res){

  const deleteItemId = req.body.checkedItem;
  const deleteItemListName = req.body.listName;

  console.log(deleteItemId);
  console.log(deleteItemListName);

  if (deleteItemListName === "Today") {

    Item.findByIdAndDelete(deleteItemId, function(err) {

      if (!err) {

        console.log("Successfully deleted!");
        res.redirect("/");

      };
    });
  } else {

    List.findOneAndUpdate({name: deleteItemListName}, {$pull: {items: {_id: deleteItemId}}}, function(err, results){
      if (!err){
        res.redirect("/"+deleteItemListName);
      }
    });

  };

});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
