const KDAChartConfig = {
	type: "XYChart",
	data: [],
	legend: {
		position: "bottom",
		labels: {
			textDecoration: "none",
			fill: "#ffffff",
		},
	},
	titles: [
		{
			text: "KDA Score",
			fontSize: 30,
			fill: "white",
		},
	],
	xAxes: [
		{
			type: "CategoryAxis",
			dataFields: {
				category: "category",
			},
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 10,
				},
				grid: {
					template: {
						disabled: true,
					},
				},
				minGridDistance: 20,
			},
		},
	],
	yAxes: [
		{
			type: "ValueAxis",
			min: 0,
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 15,
				},
				maxLabelPosition: 1.2,
				grid: {
					template: {
						disabled: true,
					},
				},
			},
		},
	],
	series: [
		{
			name: "KDA",
			bullets: [
				{
					type: "LabelBullet",
					label: {
						text: "{k}",
						fontSize: 10,
						fill: "white",
						truncate: false,
						dy: 10,
					},
				},
			],
			type: "ColumnSeries",
			columns: {
				width: "25",
				fill: "#6593F5",
				stroke: "none",
			},
			dataFields: {
				valueY: "k",
				categoryX: "category",
			},
		},
	],
}

const PositionChartConfig = {
	legend: {
		position: "bottom",
		labels: {
			textDecoration: "none",
			fill: "#ffffff",
			// text: "[bold {stroke}]{name}[/]",
		},
	},
	titles: [
		{
			text: "Positions",
			fontSize: 30,
			fill: "white",
		},
	],
	type: "XYChart",
	data: [],
	xAxes: [
		{
			type: "CategoryAxis",
			dataFields: {
				category: "category",
			},
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 10,
				},
				grid: {
					template: {
						disabled: true,
					},
				},
				minGridDistance: 20,
			},
		},
	],
	yAxes: [
		{
			axisRanges: [],
			min: 0,
			type: "ValueAxis",
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 20,
					template: {
						disabled: true,
					},
				},
				maxLabelPosition: 1,
				grid: {
					template: {
						disabled: true,
					},
				},
			},
		},
	],
	series: [
		{
			type: "LineSeries",
			name: "",
			fill: "#0077b6",
			stroke: "#0077b6",
			bullets: {
				values: [
					{
						children: [
							{
								type: "Circle",
								width: 2,
								height: 2,
								horizontalCenter: "middle",
								verticalCenter: "middle",
							},
						],
					},
				],
				template: {
					type: "Bullet",
					fill: "#0077b6",
				},
			},
			dataFields: {
				valueY: "value1",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
		{
			type: "LineSeries",
			name: "",
			fill: "#d54a48",
			stroke: "#d54a48",
			bullets: {
				values: [
					{
						children: [
							{
								type: "Circle",
								width: 2,
								height: 2,
								horizontalCenter: "middle",
								verticalCenter: "middle",
							},
						],
					},
				],
				template: {
					type: "Bullet",
					fill: "#d54a48",
				},
			},
			dataFields: {
				valueY: "value2",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
		{
			type: "LineSeries",
			name: "",
			fill: "#72cc50",
			stroke: "#72cc50",
			bullets: {
				values: [
					{
						children: [
							{
								type: "Circle",
								width: 2,
								height: 2,
								horizontalCenter: "middle",
								verticalCenter: "middle",
							},
						],
					},
				],
				template: {
					type: "Bullet",
					fill: "#72cc50",
				},
			},
			dataFields: {
				valueY: "value3",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
		{
			type: "LineSeries",
			name: "",
			fill: "#fff989",
			stroke: "#fff989",
			bullets: {
				values: [
					{
						children: [
							{
								type: "Circle",
								width: 2,
								height: 2,
								horizontalCenter: "middle",
								verticalCenter: "middle",
							},
						],
					},
				],
				template: {
					type: "Bullet",
					fill: "#fff989",
				},
			},
			dataFields: {
				valueY: "value4",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
	],
}
const MoneyChartConfig = {
	legend: {
		position: "bottom",
		labels: {
			textDecoration: "none",
			fill: "#ffffff",
			// text: "[bold {stroke}]{name}[/]",
		},
	},
	titles: [
		{
			text: "Money Obtain",
			fontSize: 30,
			fill: "white",
		},
	],
	type: "XYChart",
	data: [],
	xAxes: [
		{
			type: "CategoryAxis",
			dataFields: {
				category: "category",
			},
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 10,
				},
				grid: {
					template: {
						disabled: true,
					},
				},
				minGridDistance: 25,
			},
		},
	],
	yAxes: [
		{
			min: 0,
			type: "ValueAxis",
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 13,
				},
				grid: {
					template: {
						stroke: "#707070",
						strokeWidth: 1,
						strokeOpacity: 1,
					},
				},
				maxLabelPosition: 1,
				minGridDistance: 25,
			},
		},
	],
	series: [
		{
			type: "LineSeries",
			name: "",
			fill: "#0077b6",
			stroke: "#0077b6",
			bullets: {},
			dataFields: {
				valueY: "value1",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
		{
			type: "LineSeries",
			name: "",
			fill: "#d54a48",
			stroke: "#d54a48",
			bullets: {},
			dataFields: {
				valueY: "value2",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
		{
			type: "LineSeries",
			name: "",
			fill: "#72cc50",
			stroke: "#72cc50",
			bullets: {},
			dataFields: {
				valueY: "value3",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
		{
			type: "LineSeries",
			name: "",
			fill: "#fff989",
			stroke: "#fff989",
			bullets: {},
			dataFields: {
				valueY: "value4",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
	],
}

const CharacterTrendChartConfig = {
	titles: [
		{
			text: "Win Rate Trend",
			fontSize: 20,
			fill: "white",
		},
	],
	type: "XYChart",
	data: [],
	xAxes: [
		{
			type: "CategoryAxis",
			dataFields: {
				category: "category",
			},
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 10,
				},
				grid: {
					template: {
						disabled: true,
					},
				},
				minGridDistance: 25,
			},
		},
	],
	yAxes: [
		{
			type: "ValueAxis",
			renderer: {
				labels: {
					fill: "#ffffff",
					fontSize: 13,
					disabled: true,
				},
				grid: {
					template: {
						disabled: true,
					},
				},
			},
		},
	],
	series: [
		{
			tensionX: 0.8,
			type: "LineSeries",
			name: "",
			fill: "#0077b6",
			stroke: "#0077b6",
			bullets: [
				{
					type: "CircleBullet",
					circle: {
						stroke: "#fff",
						strokeWidth: 2,
					},
				},
				{
					type: "LabelBullet",
					label: {
						text: "{value}%",
						dy: 20,
						fill: "#FFFFFF",
					},
				},
			],
			dataFields: {
				valueY: "value",
				categoryX: "category",
			},
			sequencedInterpolation: false,
			sequencedInterpolationDelay: 100,
		},
	],
}
