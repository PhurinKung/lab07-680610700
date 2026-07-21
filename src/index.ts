import express, { type Request, type Response } from 'express';

// import middleware
import morgan from "morgan";

// import database
import { students } from '@db/db.js';
import { type Student, type Course } from "@libs/types.js";
import {
  zStudentDeleteBody,
  zStudentPostBody,
  zStudentPutBody,
} from "@libs/studentValidator.js";
import type { OK } from 'zod/v3';

const app = express();
const port = process.env.PORT || 3000;

// use middleware
app.use(morgan("dev", { immediate: false }));
app.use(express.json());    // parses request's payload into 'req.body'

// Endpoints
app.get("/", (req: Request, res: Response) => {
  res.send("API services for Student Data");
});

// GET /students
// get students (by program)
app.get("/students", (req: Request, res: Response) => {
  try {
    const program = req.query.program;
    const studentId = req.query.studentId;

    const formatStudent = (student: Student) => ({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      program: student.program,
    });

    if(program && studentId) {
      let filtered_students = students.filter(
        (student) => student.program === program && student.studentId===studentId
      );
      return res.json({
        ok: true,
        students: filtered_students.map(formatStudent),
      });
    }
    else if (program) {
      let filtered_students = students.filter(
        (student) => student.program === program
      );
      return res.json({
        ok: true,
        students: filtered_students.map(formatStudent),
      });
    } 
    else if(studentId) {
      let filtered_students = students.filter(
        (student) => student.studentId === studentId
      );
      return res.json({
        ok: true,
        students: filtered_students.map(formatStudent),
      });
    } 
    else {
      return res.json({
        success: true,
        count: students.length,
        students: students,
      });
    }

    

  } catch (err) {
    return res.json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

// POST /students, body = {new student data}
// add a new student
app.post("/students", (req: Request, res: Response) => {
  try {
    const body = req.body as Student;

    // validate req.body with predefined validator
    const result = zStudentPostBody.safeParse(body); // check zod
    if (!result.success) {
      return res.json({
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    //check duplicate studentId
    const found = students.find(
      (student) => student.studentId === body.studentId
    );
    if (found) {
      return res.json({
        success: false,
        message: "Student is already exists",
      });
    }

    // add new student
    const new_student = body;
    students.push(new_student);

    // add response header 'Link'
    res.set("Link", `/students/${new_student.studentId}`);

    return res.json({
      success: true,
      data: new_student,
    });
    // return res.json({ ok: true, message: "successfully" });
  } catch (err) {
    return res.json({
      success: false,
      message: "Somthing is wrong, please try again",
      error: err,
    });
  }
});

// PUT /students, body = {studentId}
// Update specified student
app.put("/students", (req: Request, res: Response) => {
  try {
    const body = req.body as Student;

    // validate req.body with predefined validator
    const result = zStudentPutBody.safeParse(body); // check zod
    if (!result.success) {
      return res.json({
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    //check duplicate studentId
    const foundIndex = students.findIndex(
      (student) => student.studentId === body.studentId
    );

    if (foundIndex === -1) {
      return res.json({
        success: false,
        message: "Student does not exists",
      });
    }

    // update student data
    students[foundIndex] = { ...students[foundIndex], ...body };

    // add response header 'Link'
    res.set("Link", `/students/${body.studentId}`);

    return res.json({
      success: true,
      message: `Student ${body.studentId} has been updated successfully`,
      data: students[foundIndex],
    });
  } catch (err) {
    return res.json({
      success: false,
      message: "Somthing is wrong, please try again",
      error: err,
    });
  }
});

// DELETE /students, body = {studentId}
app.delete("/students", (req: Request, res: Response) => {
  const student = req.body as Student;
  //check validation  
  const val = zStudentDeleteBody.safeParse(student);
  if(!val.success){
    return res.json({
      ok: false,
      message: val.error.issues[0]?.message
    })
  } 
  const foundIndex = students.findIndex((s)=> s.studentId===student.studentId)
  if(foundIndex===-1) // cannot find
  {
    return res.json({
      success: false,
      message: "Student ID does not exist"
    })
  }

  students.splice(foundIndex,1);
  return res.json({
    ok: true,
    message: `Student Id ${student.studentId} has been deleted`,
  })
});

// GET /api/me
app.get('/api/me', (req:Request, res:Response) => {
  return res.json({
    ok: true,
    fullName: "Phichamon  Kaewboot",
    studentId: "680610700"
  })
})

app.listen(port, async () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default app;