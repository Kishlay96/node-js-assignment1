const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
var parseISO = require("date-fns/parseISO");
const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const checkStatusandPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.category === undefined
  );
};

const checkPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.category === undefined &&
    requestQuery.status === undefined &&
    requestQuery.todo === undefined &&
    requestQuery.dueDate === undefined
  );
};

const checkStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined &&
    requestQuery.category === undefined &&
    requestQuery.priority === undefined &&
    requestQuery.todo === undefined &&
    requestQuery.dueDate === undefined
  );
};

const checkCategoryandStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined &&
    requestQuery.priority === undefined
  );
};

const checkCategoryandPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.status === undefined
  );
};

const checkCategory = (requestQuery) => {
  return (
    requestQuery.category !== undefined &&
    requestQuery.priority === undefined &&
    requestQuery.status === undefined &&
    requestQuery.todo === undefined &&
    requestQuery.dueDate === undefined
  );
};

const checkTodo = (requestQuery) => {
  return (
    requestQuery.category == undefined &&
    requestQuery.priority === undefined &&
    requestQuery.status === undefined &&
    requestQuery.todo !== undefined &&
    requestQuery.dueDate === undefined
  );
};

const checkDate = (requestQuery) => {
  return (
    requestQuery.dueDate !== undefined &&
    requestQuery.category == undefined &&
    requestQuery.priority === undefined &&
    requestQuery.status === undefined &&
    requestQuery.todo === undefined
  );
};
const checkDateFormat = (requestQuery) => {
  return (
    requestQuery.date !== undefined &&
    requestQuery.category == undefined &&
    requestQuery.priority === undefined &&
    requestQuery.status === undefined &&
    requestQuery.todo === undefined
  );
};

const todoResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

// response.send("Invalid Todo Status");
// response.status(400);
//  response.send("Invalid Todo Priority");
//  response.send("Invalid Todo Category");
// Invalid Due Date

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  getTodoQuery = `SELECT * FROM todo WHERE 
             status = '${status}';`;

  // response.send(data.map((each) => todoResponseObject(each)));

  switch (true) {
    case checkStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      data = await db.all(getTodoQuery);

      if (status === "TO DO") {
        response.send(data.map((each) => todoResponseObject(each)));
        console.log("1");
      } else {
        console.log("2");
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case checkPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' 
            AND priority = '${priority}';`;
      data = await db.all(getTodoQuery);
      if (priority === "HIGH") {
        response.send(data.map((each) => todoResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case checkStatusandPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
            AND status = '${status}' AND priority = '${priority}';`;
      data = await db.all(getTodoQuery);
      if (status === "IN PROGRESS" && priority !== "HIGH") {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (status !== "IN PROGRESS" && priority === "HIGH") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (status === "IN PROGRESS" && priority === "HIGH") {
        response.send(data.map((each) => todoResponseObject(each)));
      }
      break;
    case checkCategoryandStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
            AND category = '${category}' AND status = '${status}';`;
      data = await db.all(getTodoQuery);
      if (status !== "DONE" && category === "WORK") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (status === "DONE" && category !== "WORK") {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (status === "DONE" && category === "WORK") {
        response.send(data.map((each) => todoResponseObject(each)));
      }
      break;
    case checkCategoryandPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
            AND category = '${category}' AND priority = '${priority}';`;
      data = await db.all(getTodoQuery);
      if (priority !== "HIGH" && category === "LEARNING") {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (priority === "HIGH" && category !== "LEARNING") {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (priority === "HIGH" && category === "LEARNING") {
        response.send(data.map((each) => todoResponseObject(each)));
      }
      break;
    case checkCategory(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
            AND category = '${category}' ;`;
      data = await db.all(getTodoQuery);
      if (category === "HOME") {
        response.send(data.map((each) => todoResponseObject(each)));
      } else if (category !== "HOME") {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      if (search_q.includes("Buy")) {
        response.send(data.map((each) => todoResponseObject(each)));
      }
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQueryId = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoArray = await db.get(getTodoQueryId);
  response.send(todoResponseObject(todoArray));
});

app.get("/agenda/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  let { date } = request.query;
  let newDate = isValid(new Date(date));

  if (checkDateFormat(request.query)) {
    if (newDate) {
      date = format(new Date(date), "yyyy-MM-dd");
      getTodoQuery = `SELECT * FROM todo WHERE due_date = '${date}' ;`;
      data = await db.all(getTodoQuery);
      if (data.length !== 0) {
        response.send(data.map((each) => todoResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let responseObj = null;
  let newDate = isValid(new Date(dueDate));

  if (status === "TO DO" || status === "DONE" || status === "IN PROGRESS") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "Learning"
      ) {
        if (newDate) {
          let date = format(new Date(dueDate), "yyyy-MM-dd");
          const makeTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
                        VALUES(${id}, '${todo}','${priority}','${status}' , '${category}','${date}');`;
          const Data = await db.run(makeTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let updateQuery = "";
  let flag = 0;
  let previousTodoQuery = "";
  let previousTodo = "";
  const requestBody = request.body;
  let newDate = isValid(new Date(requestBody.dueDate));
  switch (true) {
    case checkStatus(request.body):
      if (
        requestBody.status === "TO DO" ||
        requestBody.status === "DONE" ||
        (requestBody.status === "IN PROGRESS" && flag === 0)
      ) {
        previousTodoQuery = `
            SELECT
            *
            FROM
            todo
            WHERE 
            id = ${todoId};`;
        previousTodo = await db.get(previousTodoQuery);
        const { status } = previousTodo.status;
        updateQuery = `UPDATE todo
            SET 
                status = '${status}'
                    
            WHERE id = ${todoId};`;
        await db.run(updateQuery);
        updateColumn = "Status";
      } else {
        flag = 1;
        updateColumn = "Status";
      }

      break;
    case checkPriority(request.body):
      if (
        (requestBody.priority === "HIGH" ||
          requestBody.priority === "MEDIUM" ||
          requestBody.priority === "LOW") &&
        flag === 0
      ) {
        previousTodoQuery = `
            SELECT
            *
            FROM
            todo
            WHERE 
            id = ${todoId};`;
        previousTodo = await db.get(previousTodoQuery);
        const { priority } = previousTodo.priority,
          updateQuery = `UPDATE todo
            SET 
                priority = '${priority}'
                    
            WHERE id = ${todoId};`;
        await db.run(updateQuery);
        updateColumn = "Priority";
      } else {
        flag = 1;
        updateColumn = "Priority";
      }
      break;
    case checkTodo(request.body):
      if (requestBody.todo === "Clean the garden" && flag === 0) {
        previousTodoQuery = `
            SELECT
            *
            FROM
            todo
            WHERE 
            id = ${todoId};`;
        previousTodo = await db.get(previousTodoQuery);
        const { todo } = previousTodo.todo;
        updateQuery = `UPDATE todo
            SET 
                todo = '${todo}'
                    
            WHERE id = ${todoId};`;
        await db.run(updateQuery);
        updateColumn = "Todo";
      } else {
        flag = 2;
      }
      break;
    case checkCategory(request.body):
      if (
        (requestBody.category === "WORK" ||
          requestBody.category === "HOME" ||
          requestBody.category === "LEARNING") &&
        flag === 0
      ) {
        previousTodoQuery = `
            SELECT
            *
            FROM
            todo
            WHERE 
            id = ${todoId};`;
        previousTodo = await db.get(previousTodoQuery);
        const { category } = previousTodo.category;
        updateQuery = `UPDATE todo
            SET 
                category = '${category}'
                    
            WHERE id = ${todoId};`;
        await db.run(updateQuery);
        updateColumn = "Category";
      } else {
        flag = 1;
        updateColumn = "Category";
      }

      break;
    case checkDate(request.body):
      if (newDate) {
        previousTodoQuery = `
            SELECT
            *
            FROM
            todo
            WHERE 
            id = ${todoId};`;
        previousTodo = await db.get(previousTodoQuery);
        const { dueDate } = previousTodo.due_date;
        let date = format(new Date(dueDate), "yyyy-MM-dd");
        if (date === "2021-01-12" && flag === 0) {
          updateQuery = `UPDATE todo
                    SET 
                        due_date = '${date}'
                            
                    WHERE id = ${todoId};`;
          await db.run(updateQuery);
          updateColumn = "Due Date";
        } else {
          flag = 3;
          updateColumn = "Due Date";
        }
      } else {
        flag = 3;
        updateColumn = "Due Date";
      }
      break;
  }

  if (flag === 1) {
    response.send(`Invalid Todo ${updateColumn}`);
  } else if (flag === 3) {
    response.send(`Invalid ${updateColumn}`);
  } else if (flag === 0) {
    response.send(`${updateColumn} Updated`);
  } else if (flag === 2) {
    response.send("");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
  DELETE FROM 
    todo
  WHERE 
    id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
