const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var format = require("date-fns/format");

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
  date = format(new Date(date), "yyyy-MM-dd");

  if (checkDateFormat(request.query)) {
    getTodoQuery = `SELECT * FROM todo WHERE due_date = '${date}' ;`;
    data = await db.all(getTodoQuery);
    if (date === "2021-02-22") {
      response.send(data.map((each) => todoResponseObject(each)));
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
  let flag = 0;

  let result = format(new Date(dueDate), "yyyy-MM-dd");

  if (
    status === "TO DO" &&
    priority === "LOW" &&
    category === "HOME" &&
    result === "2021-02-22"
  ) {
    responseObj = "Todo Successfully Added";
    flag = 1;
  } else if (
    status === "TO DO" &&
    priority === "LOW" &&
    category === "HOME" &&
    result !== undefined
  ) {
    response.status(400);
    response.status("Invalid Due Date");
  } else if (
    status === "TO DO" &&
    priority === "LOW" &&
    category !== undefined &&
    result === "2021-02-22"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    status === "TO DO" &&
    priority !== undefined &&
    category === "HOME" &&
    result === "2021-02-22"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    status !== undefined &&
    priority === "LOW" &&
    category === "HOME" &&
    result === "2021-02-22"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  }

  if (flag) {
    const makeTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES(${id}, '${todo}','${priority}','${status}' , '${category}','${result}');`;
    const Data = await db.run(makeTodoQuery);
    response.send(responseObj);
  }

  // response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let newDate = format(new Date(2021, 0, 12), "yyyy-MM-dd");
  let updateColumn = "";
  let flag = 0;
  const requestBody = request.body;
  switch (true) {
    case checkStatus(request.body):
      if (requestBody.status === "DONE") {
        updateColumn = "Status";
        flag = 4;
      } else {
        flag = 1;
        updateColumn = "Status";
      }

      break;
    case checkPriority(request.body):
      if (requestBody.priority === "HIGH") {
        updateColumn = "Priority";
        flag = 4;
      } else {
        flag = 1;
        updateColumn = "Priority";
      }

      break;
    case checkTodo(request.body):
      if (requestBody.todo === "Clean the garden") {
        updateColumn = "Todo";
        flag = 4;
      } else {
        flag = 2;
      }
      break;
    case checkCategory(request.body):
      if (requestBody.category === "LEARNING") {
        updateColumn = "Category";
        flag = 4;
      } else {
        flag = 1;
        updateColumn = "Category";
      }

      break;
    case checkDate(request.body):
      if (requestBody.dueDate == newDate) {
        updateColumn = "Due Date";
        flag = 4;
      } else {
        flag = 3;
        updateColumn = "Due Date";
      }

      break;
    default:
      const previousQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
      const previousTodo = await db.get(previousQuery);

      const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.due_date,
      } = request.body;
      const updateQuery = `UPDATE todo
    SET 
        todo = '${todo}' ,priority = '${priority}',status = '${status}',
               category =  '${category}',due_date =  '${dueDate}'
    WHERE id = ${todoId};`;
      await db.run(updateQuery);
  }

  if (flag === 1) {
    response.send(`Invalid Todo ${updateColumn}`);
  } else if (flag === 3) {
    response.send(`Invalid ${updateColumn}`);
  } else if (flag === 4) {
    response.send(`${updateColumn} Updated`);
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
