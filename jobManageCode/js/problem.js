var problems = {
    info: [],
    processState: function (problem) {
        problem.state = problem.state[0];
        return this;
    },
    table: {
        setAllTable: function () {
            $('#allProblemTable').bootstrapTable({
                // toolbar: "#toolbar",
                // sidePagination: "true",
                // striped: true, // 是否显示行间隔色
                //search : "true",
                // uniqueId: "ID",
                // pageSize: "5",
                // pagination: true, // 是否分页
                // sortable: true, // 是否启用排序
                columns: [
                    {
                        field: 'id',
                        title: '问题单号'
                    },
                    {
                        field: 'describe',
                        title: '简述'
                    },
                    {
                        field: 'processer',
                        title: '当前处理人'
                    },
                    {
                        field: 'state',
                        title: '当前状态'
                    },
                    {
                        field: 'grade',
                        title: '严重程度'
                    },
                ],
                data: problems.info,
            });
            return this;
        }
    }
}

var processers = {
    info: {},
    getProcesserAndProblem: function (problem) {
        var __info = this.info;
        var person = problem.processer;
        if (!__info[person]) {
            __info[person] = {
                all: [],
                state: {
                    processing: [],
                    finshed: [],
                    other: []
                },
                grade: {
                    little: [],
                    normal: [],
                    bad: [],
                    terrible: []
                }
            };
        }
        __info[problem.processer].all.push(problem);

        //按处理阶段统计 
        if (('3' == problem.state) || ('5' == problem.state) || ('B' == problem.state)) {
            __info[person].state.processing.push(problem);
        } else if (('0' == problem.state) || ('E' == problem.state) || ('F' == problem.state) || ('G' == problem.state)) {
            __info[person].state.finshed.push(problem);
        } else {
            __info[person].state.other.push(problem);
        }

        //按问题级别统计
        switch (problem.state) {
            case '提示': {
                __info[person].grade.little.push(problem);
                break;
            };
            case '一般': {
                __info[person].grade.normal.push(problem);
                break;
            };
            case '严重': {
                __info[person].grade.bad.push(problem);
                break;
            };
            case '致命': {
                __info[person].grade.terrible.push(problem);
                break;
            };
            default: {
                break;
            }
        }
        return this;
    },
    // getStatic: function () {
    //     var info = this.info;
    //     for (person in info) {
    //         var staticInfo = {
    //             processer: person,
    //             problems: info[person].all.length,
    //             state:{

    //             }
    //         }
    //         this.static.push(staticInfo);
    //     }
    //     this.static.sort(function (a, b) {
    //         return (b.problems - a.problems);
    //     });
    //     return this;
    // },
    bar: {
        id: echarts.init(document.getElementById('proceserEchart')),
        option: {
            grid: {
                left: '60px',
                right: '50px',
                top: '50px',
                bottom: '30px'
            },
            color: ['#00B8D3', '#aeea00', '#00bfa5'],
            legend: {
                data:['修改中','已完成','其他']
            },
            xAxis: {
                type: 'category',
                data: [],
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: '修改中',
                    stack: '问题',
                    type: 'bar',
                    data: [],
                },
                {
                    name: '已完成',
                    stack: '问题',
                    type: 'bar',
                    data: [],
                },
                {
                    name: '其他',
                    stack: '问题',
                    type: 'bar',
                    data: [],
                },
            ]
        },
        getData: function () {
            var info = processers.info;
            var data = {
                person: [],
                problem: [],
                state: {
                    processing: [],
                    finshed: [],
                    other: []
                }
            }
            for (person in info) {
                var problem = info[person]
                data.person.push(person);
                data.problem.push(problem.all.length);
                data.state.processing.push(problem.state.processing.length);
                data.state.finshed.push(problem.state.finshed.length);
                data.state.other.push(problem.state.other.length);
            }
            return data;
        },
        setOption: function () {
            var data = this.getData();
            this.option.xAxis.data = data.person;
            // this.option.series[0].data = data.problemNum;
            this.option.series[0].data = data.state.processing;
            this.option.series[1].data = data.state.finshed;
            this.option.series[2].data = data.state.other;
            this.id.setOption(this.option);
        }
    }
}

var fileColumName = {
    "问题单号": function () {
        return 'id';
    },
    "简述": function () {
        return 'describe';
    },
    "当前责任人": function () {
        return 'processer';
    },
    "当前状态": function () {
        return 'state';
    },
    "严重程度": function () {
        return 'grade';
    },
    "提单人": function () {
        return 'problemer';
    }
}

function processData() {
    problems.info.forEach(problem => {
        problems.processState(problem);
        processers.getProcesserAndProblem(problem);
    });
}

$('#problem-file').change(function (e) {
    var files = e.target.files;
    var fileReader = new FileReader();
    fileReader.readAsBinaryString(files[0]);

    fileReader.onload = function (e) {

        // 读取 excel文件
        problems.info = readXlsxToJson(e.target.result, fileColumName);

        processData();

        processers.bar.setOption();
        problems.table.setAllTable();
        console.log(problems);
        console.log(processers);

    }
})