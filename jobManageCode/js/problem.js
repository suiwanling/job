var problems = {
    info: [],
    processState:function(problem){
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
                data:problems.info,
            });
            return this;
        }
    }
}

var processers = {
    info: {},
    static: [],
    getProcesserAndProblem: function (problem) {
        var __info = this.info;
        if (!__info[problem.processer]) {
            __info[problem.processer] = {
                all:[],
                processing:[],
                finshed:[],
                other:[]
            };
        }
        __info[problem.processer].all.push(problem);
        return this;
    },
    getStatic: function () {
        var info = this.info;
        for (person in info) {
            var staticInfo = {
                processer: person,
                problems: info[person].all.length,
            }
            this.static.push(staticInfo);
        }
        this.static.sort(function (a, b) {
            return (b.problems - a.problems);
        });
        return this;
    },
    bar: {
        id: echarts.init(document.getElementById('proceserEchart')),
        option: {
            grid: {
                left: '60px',
                right: '50px',
                top: '50px',
                bottom: '30px'
            },
            color: ['#00B8D3'],
            xAxis: {
                type: 'category',
                data: [],
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                type: 'bar',
                data: [],
            }]
        },
        getData: function () {
            var info = processers.static;
            var data = {
                person: [],
                problemNum: []
            }
            info.forEach(static => {
                data.person.push(static.processer);
                data.problemNum.push(static.problems);
            })
            return data;
        },
        setOption: function () {
            var data = this.getData();
            this.option.xAxis.data = data.person;
            this.option.series[0].data = data.problemNum;

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
    processers.getStatic();
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