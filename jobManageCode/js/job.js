var jobs = {
    info: [],
    color: {
        colorArr: ['#00B8D3', '#00bfa5', '#aeea00', '#ffd600', '#ffab00', '#00c853',
            '#64dd17', '#388E3C', '#607D8B', '#ff6d00', '#3e2723'
        ],
        colorIndex: 0,

        setColor: function () {
            var colorNum = this.colorArr.length;
            var jobColor = this.colorArr[this.colorIndex];
            if (this.colorIndex < (colorNum - 1)) {
                this.colorIndex++;
            } else {
                this.colorIndex = 0;
            }
            return jobColor;
        }
    },
    processTime: function (job) {
        //处理项目时间
        if ((job.startTimePlanned) && (job.endTimePlanned)) {
            job.startTime = job.startTimeActual ? job.startTimeActual : job.startTimePlanned;
            job.endTime = (job.startTimeActual && job.endTimeActual) ? job.endTimeActual : job.endTimePlanned;

            job.startTime = (new Date(job.startTime)).getTime();
            job.endTime = (new Date(job.endTime)).getTime();

            job.workdays = 0;
        }
        return this;
    },
    setJobColor: function (job) {
        job.color = this.color.setColor(job);
        return this;
    },
    processWorks: function (job) {
        job.workNum = 0;
        if (job.workers) {
            var __workers = job.workers.trim();
            job.workers = __workers.replace(/(,*$)/g, "").split(',');
            // job.workers = __workers.substr(0, __workers.length - 1).split(',');
            job.workNum = job.workers.length;
        }else{
            job.workers = [];
        }
        return this;
    },
    processCodeLines: function (job) {
        job.codeLines = job.codeLinesActual ? job.codeLinesActual : job.codeLinesPlanned;
        return this;
    }
}

var workdays = {
    startTime: 0,
    endTime: 0,
    days: {
        info:{},
        daysMs: [],
        daysDate: []
    },
    holidays: {
        '2018': [].map(function (day) {
            return (new Date(day)).getTime();
        }),
        '2019': [
            '2019-01-01',
            '2019-02-04', '2019-02-05', '2019-02-06', '2019-02-07', '2019-02-08', '2019-02-11',
            '2019-04-05',
            '2019-05-01',
            '2019-06-07',
            '2019-09-13',
            '2019-02-02',
            '2019-10-01', '2019-10-02', '2019-10-03', '2019-10-04', '2019-10-05', '2019-10-07',
        ].map(function (day) {
            return (new Date(day)).getTime();
        })
    },
    weekdaysoff: {
        '2018': [].map(function (day) {
            return (new Date(day)).getTime();
        }),
        '2019': [
            '2019-02-02',
            '2019-09-29',
            '2019-09-30',
            '2019-10-12',
        ].map(function (day) {
            return (new Date(day)).getTime();
        })
    },
    getStartTime: function (job) {
        if (!this.startTime) {
            this.startTime = job.startTime;
        }
        if (job.startTime < this.startTime) {
            this.startTime = job.startTime;
        }
        return this;
    },
    getEndTime: function (job) {
        if (!this.endTime) {
            this.endTime = job.endTime;
        }
        if (job.endTime > this.endTime) {
            this.endTime = job.endTime;
        }
        return this;
    },
    getWorkDays: function () {
        var startTime = this.startTime;
        var endTime = this.endTime;
        var oneDayMs = 24 * 3600 * 1000;
        var dayInfo = this.days.info;
        if (startTime && endTime) {
            while (startTime <= endTime) {
                var date = new Date(startTime);
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDay();

                //删除法定节假日
                if ((0 !== day) && (6 != day)) {
                    if (this.holidays[year]) {
                        if (-1 != this.holidays[year].indexOf(startTime)) {
                            startTime = startTime + oneDayMs;
                            continue;
                        }
                    }
                } else {
                    if (this.holidays[year]) {
                        if (-1 == this.weekdaysoff[year].indexOf(startTime)) {
                            startTime = startTime + oneDayMs;
                            continue;
                        }
                    }
                }

                if (dayInfo[year]) {
                    dayInfo[year].num++;
                } else {
                    dayInfo[year] = {
                        num: 1,
                        mon: {}
                    }
                }
                if (dayInfo[year].mon[month]) {
                    dayInfo[year].mon[month]++;
                } else {
                    dayInfo[year].mon[month] = 1;
                }

                this.days.daysDate.push(date);
                this.days.daysMs.push(startTime);

                startTime = startTime + oneDayMs;
            }
        }
        return this;
    },
}

var workers = {
    info: {},
    getJobOfWorker: function (job) {
        var jobWorkers = job.workers;
        var workersInfo = this.info;
        jobWorkers.forEach(function (worker) {
            if (!workersInfo[worker]) {
                workersInfo[worker] = [];
            }
            workersInfo[worker].push(job);
        }, this)
        return this;
    }
}

var table = {
    createDateHeader: function () {
        var yearRows = '<tr>';
        var monthRows = '<tr>', __monthRow = [];
        var dayRows = '<tr>';
        var date = workdays.days.info;
        var days = workdays.days.daysMs;
        for (year in date) {
            yearRows += '<th colspan=' + date[year].num + '><div>' + year + '年</div></th>';
            var months = date[year].mon;
            for (month in months) {
                monthRows += '<th colspan=' + months[month] + '><div>' + month + '月</div></th>'
            }
        }
        days.forEach(function (day) {
            dayRows += '<th><div class="date">' + (new Date(day)).getDate() + '</div></th>';
        }, this);
        yearRows += '</tr>';
        monthRows += '</tr>';
        dayRows += '</tr>';

        return yearRows + monthRows + dayRows;
    },
    createDateBodyRow: function(job){
        var date = workdays.days.daysMs;
        var row = '<tr>';
        function isWorkDay(day){
            return ((day >= job.startTime) && (day <= job.endTime));
        }
        date.forEach(function(day){
            if (isWorkDay(day)){
                row += '<td style="background:' + job.color + '" class="date"><div></div></td>';
                //计算项目实际工作日
                job.workdays ++;
            }
            else{
                row += '<td class="date"><div></div></td>';
            }
        });
        row += '</tr>';
        return row;
    },
    createJobsHeader: function(){
        row = [
            '<tr>',
            '<th><div class="jobName tableHeader">特性</div></th>',
            '<th><div class="codeLines tableHeader">工作量(K)</div></th>',
            '<th><div class="workers tableHeader">人数</div></th>',
            '<th><div class="days tableHeader">周期(天)</div></th>',
            '</tr>'
        ].join('');
        return row;
    },
    createJobsBodyRow: function(job){
        var row = [
                '<tr>',
                '<td><div class="jobName">' + job.name + '</div></td>',
                '<td><div class="codeLines">' + job.codeLines + '</div></td>',
                '<td><div class="workers">' + job.workers.length + '</div></td>',
                '<td><div class="days">'+ job.workdays +'</div></td>',
                '</tr>'
            ].join('');
        return row;
    },

    createJobTable: function(){
        var jobsInfo = jobs.info;
        var basicInfoTable = this.createJobsHeader();
        var jobProgressTable =  this.createDateHeader();
        jobsInfo.forEach(function(job){
            //项目实际工作日在createDateBodyRow中计算， 在createJobsBodyRow中使用
            //此处需要严格保证两个函数的调用顺序
            jobProgressTable += this.createDateBodyRow(job);
            basicInfoTable += this.createJobsBodyRow(job);
        }, this);

        $("#jobBasicTable").append(basicInfoTable);
        $("#jobProgressTable").append(jobProgressTable);

        return this;
    },

    createWorkersHeader: function(){
        var row = [
            '<tr>',
            '<th><div class="workerName tableHeader">人员</div></th>',
            '<th><div class="jobNum tableHeader">任务数</div></th>',
            '<th><div class="jobName tableHeader">任务</div></th>',
            '</tr>'
        ].join('');
         
        return  row;
    },

    createWorkersBodyRow: function(worker, workerInfo){
        //插入分隔空行
        var row = '<tr colspan="3"><td><div></div></td></tr>';
        row += [
                '<tr>',
                '<td rowspan="' + workerInfo.length + '"><div class="workerName">' + worker + '</div></td>',
                '<td rowspan="' + workerInfo.length + '"><div class="jobNum">' + workerInfo.length + ' </div></td>',
                '<td><div class="jobName">' + workerInfo[0].name + ' </div></td>',
                '</tr>'
            ].join('');

        for(var i = 1; i < workerInfo.length; i++){
            row += '<tr><td><div class="jobName">' + workerInfo[i].name + ' </div></td></tr>';
        }
        return row;
    },

    createWorkersTable: function(){
        var workersInfo = workers.info;
        var workerBasicTable = this.createWorkersHeader();
        var workerDateTable = this.createDateHeader();
        var daysNum =  workdays.days.daysMs.length;
        for (worker in workersInfo){
            var __info = workersInfo[worker];
            workerDateTable += '<tr colspan="' +daysNum + '"><td style="border-left:none" ><div></div></td></tr>'
            workerBasicTable += this.createWorkersBodyRow(worker, __info);
            __info.forEach(function (job) {
                workerDateTable += this.createDateBodyRow(job);
            }, this);
        }
        $("#workerBasicTable").append(workerBasicTable);
        $("#workJobsTable").append(workerDateTable);
        return this;
    }
}

function processJobsDateWorkers() {
    var jobsInfo = jobs.info;
    jobsInfo.forEach(function (job) {

        //处理项目时间  //分配项目颜色 //处理人员信息
        jobs.processTime(job).processWorks(job).setJobColor(job).processCodeLines(job);

        //获取项目整体开始时间和结束时间
        workdays.getStartTime(job).getEndTime(job);

        //获取人员信息
        workers.getJobOfWorker(job);

    }, this);
}

var fileColumName = {
    "特性": function () {
        return 'name';
    },
    "估计规模(KLOC)": function () {
        return 'codeLinesPlanned';
    },
    "实际规模(KLOC)": function () {
        return 'codeLinesActual';
    },
    "计划开始时间": function () {
        return 'startTimePlanned';
    },
    "实际开始时间": function () {
        return 'startTimeActual';
    },
    "计划结束时间": function () {
        return 'endTimePlanned';
    },
    "实际结束时间": function () {
        return 'endTimeActual';
    },
    "计划人时": function () {
        return 'totalTimePlanned';
    },
    "实际人时": function () {
        return 'totalTimeActual';
    },
    "责任人": function () {
        return 'workers';
    },
    "进展": function () {
        return 'progress';
    },
    "状态": function () {
        return 'state';
    },
}

$('#excel-file').change(function (e) {
    var files = e.target.files;
    var fileReader = new FileReader();
    fileReader.readAsBinaryString(files[0]);

    fileReader.onload = function (e) {

        // 读取 excel文件
        jobs.info = readXlsxToJson(e.target.result, fileColumName);

        // job数据预处理
        processJobsDateWorkers();

        // 获取项目周期内的工作日
        workdays.getWorkDays();

        //生成表格
        table.createJobTable().createWorkersTable();

        // e.target.value = '';

        console.log(jobs);
        // console.log(workdays);
        // console.log(workers);

    }
})