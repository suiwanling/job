function checkAllandPerson(id){
        $("#problemOfPerson").hide();
        $("#allProblems").show();
}
var problems = {
    info: [],
    processState: function (problem) {
        problem.stateId = problem.state[0];
        return this;
    },
    table: {
        setAllTable: function () {
            $('#allProblemTable').bootstrapTable({
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
        switch (problem.stateId) {
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
                // data.state.processing.push(problem.state.processing.length);
                // data.state.finshed.push(problem.state.finshed.length);
                // data.state.other.push(problem.state.other.length);
            }
            return data;
        },
        setOption: function () {
            var data = this.getData();
            this.option.xAxis.data = data.person;
            this.option.series[0].data = data.problem;
            // this.option.series[0].data = data.state.processing;
            // this.option.series[1].data = data.state.finshed;
            // this.option.series[2].data = data.state.other;
            this.id.setOption(this.option);
        }
    }
}

var personNav = {
    data: {},
    navHtml : '',
    formateString: function (str, person) {
        return str.replace(/\{#(\w+)#\}/g, person);

    },
    createItem: function (data) {
        // 导航样式模板
        var item = '<span id={#name#} class="personsNav" onclick="personNav.go(this.id)">{#name#}</span>';
        this.navHtml += this.formateString(item, data);
        return this;
    },
    createNav:function(){
        var __info = processers.info;
        for(person in __info){
            this.createItem(person);
        }

        $('#personMeun').append(this.navHtml);
    },
    go:function(id){
        $("#allProblems").hide();
        $("#problemOfPerson").show();
    }
};

var echarts = {
    option:{
        all:{},
        person:{
            state:{},
            grade:{},
        }
    },
    init:function(){},
    setOption:function(data){},
    resizeAll:function(){},
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
        personNav.createNav();

        console.log(problems);
        console.log(processers);
        console.log(personNav);

    }
})