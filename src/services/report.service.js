const pool = require("../config/db");
const { DateTime } = require("luxon");

class ReportService {

  async generateCompanyMonthlyReport(month, year) {

    const firstDay = DateTime.local(year, month).startOf("month");
    const lastDay = DateTime.local(year, month).endOf("month");

    const empResult = await pool.query(
      "SELECT id, name, department, email FROM employee ORDER BY id"
    );

    const employees = empResult.rows;

    const attendanceResult = await pool.query(
      `SELECT emp_id, date, time_in, time_out, absent
       FROM attendance
       WHERE date BETWEEN $1 AND $2`,
      [firstDay.toISODate(), lastDay.toISODate()]
    );

    const attendanceMap = {};
    attendanceResult.rows.forEach(r => {
      const key = `${r.emp_id}_${DateTime.fromJSDate(r.date).toISODate()}`;
      attendanceMap[key] = r;
    });

    const finalData = [];
    let companyPresent = 0;
    let companyAbsent = 0;
    let companyHours = 0;

    for (let emp of employees) {

      let records = [];
      let present = 0;
      let absent = 0;
      let totalHours = 0;

      let current = firstDay;

      while (current <= lastDay) {

        const dateKey = current.toISODate();
        const mapKey = `${emp.id}_${dateKey}`;
        const attendance = attendanceMap[mapKey];

        let timeIn = "—";
        let timeOut = "—";
        let status = "Absent";
        let workedHours = 0;

        if (attendance && !attendance.absent) {
          status = "Present";
          present++;
          companyPresent++;

          if (attendance.time_in) {
            timeIn = DateTime.fromFormat(attendance.time_in, "HH:mm:ss")
              .toFormat("hh:mm a");
          }

          if (attendance.time_out) {
            timeOut = DateTime.fromFormat(attendance.time_out, "HH:mm:ss")
              .toFormat("hh:mm a");

            if (attendance.time_in) {
              const diff = DateTime.fromFormat(attendance.time_out, "HH:mm:ss")
                .diff(DateTime.fromFormat(attendance.time_in, "HH:mm:ss"), "hours").hours;

              workedHours = diff;
              totalHours += diff;
              companyHours += diff;
            }
          }
        } else {
          absent++;
          companyAbsent++;
        }

        records.push({
          date: current.toFormat("dd MMM yyyy"),
          timeIn,
          timeOut,
          status,
          workedHours: workedHours.toFixed(2)
        });

        current = current.plus({ days: 1 });
      }

      finalData.push({
        employee: emp,
        summary: {
          totalDays: records.length,
          present,
          absent,
          totalHours: totalHours.toFixed(2)
        },
        records
      });
    }

    return {
      monthName: firstDay.toFormat("MMMM yyyy"),
      companySummary: {
        totalEmployees: employees.length,
        totalPresent: companyPresent,
        totalAbsent: companyAbsent,
        totalHours: companyHours.toFixed(2)
      },
      employees: finalData
    };
  }
}

module.exports = new ReportService();