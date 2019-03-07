var jobColors = ['#00B8D3', '#00bfa5', '#aeea00', '#ffd600', '#ffab00','#00c853', '#64dd17', '#388E3C', '#607D8B',  '#ff6d00', '#3e2723'];

function outputWorkbook(data) {
    // 工作表名称集合
    var workbook = XLSX.read(data, {
        type: 'binary'
    });
    var sheetNames = workbook.SheetNames;
    sheetNames.forEach(function (name, index, arr) {
        // 只能通过工作表名称来获取指定工作表
        var worksheet = workbook.Sheets[name];
        for (var key in worksheet) {
            // v是读取单元格的原始值
            // console.log(key, key[0] === '!' ? worksheet[key] : worksheet[key].v);
            if (key[key.length - 1] === '1') {
                switch (worksheet[key].v) {
                    case "特性":
                        {
                            worksheet[key].w = 'name';
                            break;
                        };
                    case "估计规模(KLOC)":
                        {
                            worksheet[key].w = 'codeLinesPlanned';
                            break;
                        };
                    case "实际规模(KLOC)":
                        {
                            worksheet[key].w = 'codeLinesActual';
                            break;
                        };
                    case "计划开始时间":
                        {
                            worksheet[key].w = 'startTimePlanned';
                            break;
                        };
                    case "实际开始时间":
                        {
                            worksheet[key].w = 'startTimeActual';
                            break;
                        };
                    case "计划结束时间":
                        {
                            worksheet[key].w = 'endTimePlanned';
                            break;
                        };
                    case "实际结束时间":
                        {
                            worksheet[key].w = 'endTimeActual';
                            break;
                        };
                    case "计划人时":
                        {
                            worksheet[key].w = 'totalTimePlanned';
                            break;
                        };
                    case "实际人时":
                        {
                            worksheet[key].w = 'totalTimeActual';
                            break;
                        };
                    case "责任人":
                        {
                            worksheet[key].w = 'workers';
                            break;
                        };
                    case "进展":
                        {
                            worksheet[key].w = 'progress';
                            break;
                        };
                }
            }
        }
    });
    return workbook;
}

function readWorkbook(workbook) {
    var sheetNames = workbook.SheetNames;
    // 读取第一张sheet
    var worksheet = workbook.Sheets[sheetNames[0]];
    var jobJson = XLSX.utils.sheet_to_json(worksheet);

    //优先按实际开始时间排序，其次按计划开始时间排序
    jobJson.sort(function (a, b) {
        var ret = -1;
        if (a.startTimeActual) {
            if (b.startTimeActual) {
                ret = a.startTimeActual - b.startTimeActual;
            } else if (b.startTimePlanned) {
                ret = a.startTimeActual - b.startTimePlanned;
            }
        } else if (a.startTimePlanned) {
            if (b.startTimeActual) {
                ret = a.startTimePlanned - b.startTimeActual;
            } else if (b.startTimePlanned) {
                ret = a.startTimePlanned - b.startTimePlanned;
            }
        };
        return ret;
    });
    var colorIndex = 0;
    var colorNum = jobColors.length;
    jobJson.forEach(function (job, index, arr) {
        
        if (job.workers) {
            var __workers = job.workers.trim();
            job.workers = __workers.substr(0, __workers.length-1).split(',')
        }
        job.color = jobColors[colorIndex];
        if (colorIndex < (colorNum - 1)) {
            colorIndex++;
        } else {
            colorIndex = 0;
        }
    });

    return jobJson;
}

function getWorkDays(jobs) {
    var dateInfo = {
        year: [],
        month: {},
        date: {}
    };

    function getStartTime(job) {
        var time = new Date();
        if (job.startTimeActual) {
            time = (job.startTimeActual < job.startTimePlanned ? job.startTimeActual : job.startTimePlanned);
        } else {
            time = job.startTimePlanned;
        }
        return time;
    }

    function getEndTime(job) {
        var time = new Date();
        if (job.endTimeActual) {
            time = (job.endTimeActual < job.endTimePlanned ? job.endTimeActual : job.endTimePlanned);
        } else {
            time = job.endTimePlanned;
        }
        return time;
    }

    var time = {
        start: Date.parse(getStartTime(jobs[0])),
        end: Date.parse(getEndTime(jobs[jobs.length - 1])),
        oneDay: 24 * 3600 * 1000
    }

    function dateProcess(timeMs) {
        var timeMoment = moment(timeMs);
        var year = timeMoment.year();
        var month = timeMoment.month() + 1;
        var day = timeMoment.day();

        if ((0 != day) && (6 != day)) {
            if (year != dateInfo.years[dateInfo.years.length - 1]) {
                dateInfo.years.push(year);
            }
            if (!dateInfo.months[year]) {
                dateInfo.months[year] = [];
            }

            if (month != dateInfo.months[year][dateInfo.months[year].length - 1]) {
                dateInfo.months[year].push(month);
            }

            if (!dateInfo.dates[year]) {
                dateInfo.dates[year] = [];
            }
            if (!dateInfo.dates[year][month]) {
                dateInfo.dates[year][month] = [];
            }
            dateInfo.dates[year][month].push(timeMs);
            dateInfo.daysMs.push(time.start);
        }
    }

    var dateInfo = {
        years: [],
        months: {},
        dates: {},
        daysMs: []
    };

    while (time.start <= time.end) {
        dateProcess(time.start);
        time.start = time.start + time.oneDay;
    }

    console.log('######################', dateInfo);
    return dateInfo;
    // return days;
}

function getWorkersInfo(jobs) {
    var workers = {};
    jobs.forEach(function (job) {
        var jobWorkers = job.workers;
        jobWorkers.forEach(function (jobWorker) {
            if (!workers[jobWorker]) {
                workers[jobWorker] = [];
            }
            workers[jobWorker].push(job);
        })
    })
    return workers;
}

function TableCreate(jobs, workersInfo, dateInfo) {

    // 公共日期表头
    function createWorkDaysTableHead(dateInfo) {
        //创建进度信息表头
        var workDays = dateInfo.dates;
        var yearColspan = 0;
        var monthColSpan = 0;
        var dateRows = ['<tr>'];
        var __dateRow = [];
        var monthRows = ['<tr>'];
        var __monthRow = [];
        var yearRows = ['<tr>'];
        var __yearRow = [];
        var dateTableHead = [];
        for (year in workDays) {
            yearColspan = 0;
            var months = workDays[year];
            for (month in months) {
                var days = months[month];
                monthColSpan = days.length;
                yearColspan += monthColSpan;
                monthRows.push('<th colspan=' + monthColSpan + '><div>' + month + '月</div></th>');
                days.forEach(function (day) {
                    dateRows.push('<th><div class="date">' + moment(day).date() + '</div></th>');
                })
            }
            yearRows.push('<th colspan=' + yearColspan + '><div>' + year + '年</div></th>');
        }
        dateRows.push('</tr>');
        monthRows.push('</tr>');
        yearRows.push('</tr>');

        dateTableHead.push(yearRows.join(''));
        dateTableHead.push(monthRows.join(''));
        dateTableHead.push(dateRows.join(''));

        return dateTableHead;
    }

    var publicDateTHeader = createWorkDaysTableHead(dateInfo).join('');

    function dateTableRowCreate(currTime, startTime, endTime, color, rowBuf) {
        //渲染表格body
        var startTimeMs = moment(new Date(startTime)).valueOf();
        var endTimeMs = moment(new Date(endTime)).valueOf();
        var currTimeMs = moment(currTime).valueOf();
        var IS_WORK_DAYS = ((currTimeMs >= startTimeMs) && (currTimeMs <= endTimeMs));

        if (IS_WORK_DAYS) {
            rowBuf.push('<td style="background:' + color + '" class="date"><div></div></td>');
        } else {
            rowBuf.push('<td class="date"><div></div></td>');
        }
        return;
    }

    function dateTableBodyCreate(dateInfo, job, color, tableBuf) {
        var row = ['<tr>'];
        var __workDays = dateInfo.daysMs;
        __workDays.forEach(function (day, index, arr) {
            if ((job.startTimeActual) && (job.endTimeActual)) {
                dateTableRowCreate(day, job.startTimeActual, job.endTimeActual, color, row);
            } else if (job.startTimeActual) {
                dateTableRowCreate(day, job.startTimeActual, job.endTimePlanned, color, row);
            } else if (job.endTimeActual) {
                dateTableRowCreate(day, job.startTimePlanned, job.endTimeActual, color, row);
            } else {
                dateTableRowCreate(day, job.startTimePlanned, job.endTimePlanned, color, row);
            }
        })
        row.push('</tr>');
        tableBuf.push(row.join(''));
    }

    // 创建任务表
    (function createJobTable() {
        var basicRows = [];
        var progressRows = [];
        var __basicRow = [];

        //创建基本信息表头
        var __basicRow = [
            '<tr>',
            '<th><div class="jobName tableHeader">特性</div></th>',
            '<th><div class="codeLines tableHeader">工作量</div></th>',
            '<th><div class="workers tableHeader">人数</div></th>',
            '<th><div class="days tableHeader">计划</div></th>',
            '<th><div class="days tableHeader">实际</div></th>',
            '</tr>'
        ];
        basicRows.push(__basicRow.join(''));

        //创建任务进度表表头
        progressRows.push(publicDateTHeader);

        //创建表格body

        jobs.forEach(function (job, index, arr) {

            //创建基本信息表格body
            var __basicRow = [
                '<tr>',
                '<td><div class="jobName">' + job.name + '</div></td>',
                '<td><div class="codeLines">' + job.codeLinesPlanned + '</div></td>',
                '<td><div class="workers">' + job.workers.length + '</div></td>',
                '<td><div class="days">test</div></td>',
                '<td><div class="days">test</div></td>',
                '</tr>'
            ];
            basicRows.push(__basicRow.join(''));

            //创建进度信息表格body
            dateTableBodyCreate(dateInfo, job, job.color, progressRows);
        })

        $("#jobBasicTable").append(basicRows.join(''));
        $("#jobProgressTable").append(progressRows.join(''));
    })();

    (function createWorkerTable() {
        var basicWorkRows = [];
        var __basicWorkRow = [];
        var workJobRows = [];

        //创建人员基础本信息表头
        var __basicWorkRow = [
            '<tr>',
            '<th><div class="workerName tableHeader">人员</div></th>',
            '<th><div class="jobNum tableHeader">任务数</div></th>',
            '<th><div class="jobName tableHeader">任务</div></th>',
            '</tr>'
        ];

        basicWorkRows.push(__basicWorkRow.join(''));

        //创建人员工作任务表头
        workJobRows.push(publicDateTHeader);

        //创建表格body
        for (worker in workersInfo) {

            // 员工基本信息表格body
            basicWorkRows.push('<tr colspan="3"><td><div></div></td></tr>');
            workJobRows.push('<tr colspan="' + dateInfo.daysMs.length + '"><td style="border-left:none" ><div></div></td></tr>')
            var __info = workersInfo[worker];
            __basicWorkRow = [
                '<tr>',
                '<td rowspan="' + __info.length + '"><div class="workerName">' + worker + '</div></td>',
                '<td rowspan="' + __info.length + '"><div class="jobNum">' + __info.length + ' </div></td>',
                '<td><div class="jobName">' + __info[0].name + ' </div></td>',
                '</tr>'
            ];
            for (var i = 1; i < __info.length; i++) {
                __basicWorkRow.push('<tr><td><div class="jobName">' + __info[i].name + ' </div></td></tr>');
            }
            basicWorkRows.push(__basicWorkRow.join(''));

            //创建人员任务表格body
            __info.forEach(function (job) {
                dateTableBodyCreate(dateInfo, job, job.color, workJobRows);
            })
            // basicWorkRows.push('<tr colspan="3"><td><div></div></td></tr>');
            // workJobRows.push('<tr colspan="' + dateInfo.daysMs.length + '"><td><div></div></td></tr>')

        }

        $("#workerBasicTable").append(basicWorkRows.join(''));
        $("#workJobsTable").append(workJobRows.join(''));
    })();
}


$('#excel-file').change(function (e) {
    // console.log(e)
    var files = e.target.files;
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
        var data = e.target.result;
        // 读取 excel文件
        var workbook = outputWorkbook(data);

        //处理数据 按实际开始时间排序，如果没有实际开始时间，按计划开始时间排序
        var jobs = readWorkbook(workbook);
        console.log(jobs);

        //获取工作日
        var workDays = getWorkDays(jobs);
        console.log(workDays);

        //获取人员信息
        var workersInfo = getWorkersInfo(jobs);
        console.log('!!!!', workers);

        //生成表格
        // jobTableCreate(jobs, workDays);
        TableCreate(jobs, workersInfo, workDays);
    }

    fileReader.readAsBinaryString(files[0]);
})