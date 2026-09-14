/**
 * College ERP Attendance Parser for AyushGangster
 * Supports:
 * 1. Direct Copy-Paste of class-by-class attendance logs (with Subject Code, Name, Hours, Marked P/A)
 * 2. Direct Copy-Paste of summary attendance tables
 * 3. Excel (.xlsx, .xls) and CSV files
 */

const ErpParser = (function () {
  'use strict';

  // Sample report provided by user for instant 1-click loading and testing
  const RAW_USER_SAMPLE_REPORT = `#	Subject Code	Subject	Subject Type	Faculty Name	Date	Starting Time	Number of Hours	Marked
1	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-09-14 (Monday)	12:00 PM	1	P
2	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-09-14 (Monday)	8:15 AM	2	P
3	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-09-12 (Saturday)	1:00 PM	2	P
4	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-09-05 (Saturday)	1:00 PM	2	P
5	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-09-05 (Saturday)	12:00 PM	1	A
6	CSUT330	Industrial Training	Lab	Payal Mittal	2026-09-05 (Saturday)	10:15 AM	1	P
7	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-09-05 (Saturday)	9:15 AM	1	P
8	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-09-05 (Saturday)	8:15 AM	1	A
9	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-09-03 (Thursday)	2:00 PM	1	P
10	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-09-03 (Thursday)	1:00 PM	1	A
11	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-09-03 (Thursday)	12:00 PM	1	P
12	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-09-03 (Thursday)	8:15 AM	3	P
13	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-09-02 (Wednesday)	1:00 PM	1	P
14	CSUL302	Operating System	Lecture	Sneha Sharma	2026-09-02 (Wednesday)	12:00 PM	1	P
15	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-09-02 (Wednesday)	8:15 AM	3	P
16	CSUL302	Operating System	Lecture	Sneha Sharma	2026-09-01 (Tuesday)	1:00 PM	1	P
17	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-09-01 (Tuesday)	12:00 PM	1	P
18	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-09-01 (Tuesday)	10:15 AM	1	P
19	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-09-01 (Tuesday)	8:15 AM	2	P
20	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-31 (Monday)	1:00 PM	1	P
21	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-31 (Monday)	12:00 PM	1	P
22	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-31 (Monday)	10:15 AM	1	P
23	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-31 (Monday)	8:15 AM	2	P
24	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-29 (Saturday)	1:00 PM	2	A
25	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-29 (Saturday)	12:00 PM	1	A
26	CSUT330	Industrial Training	Lab	Payal Mittal	2026-08-29 (Saturday)	10:15 AM	1	P
27	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-29 (Saturday)	9:15 AM	1	P
28	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-29 (Saturday)	8:15 AM	1	A
29	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-27 (Thursday)	2:00 PM	1	P
30	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-27 (Thursday)	1:00 PM	1	A
31	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-27 (Thursday)	12:00 PM	1	A
32	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-08-27 (Thursday)	8:15 AM	3	A
33	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-08-26 (Wednesday)	1:00 PM	1	P
34	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-26 (Wednesday)	12:00 PM	1	P
35	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-08-26 (Wednesday)	8:15 AM	3	P
36	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-25 (Tuesday)	1:00 PM	1	P
37	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-25 (Tuesday)	12:00 PM	1	P
38	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-25 (Tuesday)	10:15 AM	1	A
39	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-08-25 (Tuesday)	8:15 AM	2	P
40	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-24 (Monday)	1:00 PM	1	P
41	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-24 (Monday)	12:00 PM	1	P
42	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-24 (Monday)	10:15 AM	1	P
43	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-24 (Monday)	8:15 AM	2	P
44	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-22 (Saturday)	1:00 PM	2	P
45	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-22 (Saturday)	12:00 PM	1	A
46	CSUT330	Industrial Training	Lab	Payal Mittal	2026-08-22 (Saturday)	10:15 AM	1	P
47	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-22 (Saturday)	9:15 AM	1	P
48	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-22 (Saturday)	8:15 AM	1	A
49	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-21 (Friday)	1:00 PM	1	P
50	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-21 (Friday)	12:00 PM	1	P
51	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-21 (Friday)	10:15 AM	1	A
52	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-08-21 (Friday)	8:15 AM	2	P
53	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-20 (Thursday)	2:00 PM	1	P
54	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-20 (Thursday)	1:00 PM	1	P
55	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-20 (Thursday)	12:00 PM	1	P
56	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-08-20 (Thursday)	8:15 AM	3	P
57	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-08-19 (Wednesday)	1:00 PM	1	A
58	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-19 (Wednesday)	12:00 PM	1	A
59	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-08-19 (Wednesday)	8:15 AM	3	P
60	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-18 (Tuesday)	1:00 PM	1	P
61	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-18 (Tuesday)	12:00 PM	1	P
62	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-18 (Tuesday)	10:15 AM	1	P
63	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-08-18 (Tuesday)	8:15 AM	2	P
64	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-17 (Monday)	1:00 PM	1	P
65	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-17 (Monday)	12:00 PM	1	P
66	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-17 (Monday)	10:15 AM	1	P
67	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-17 (Monday)	8:15 AM	2	P
68	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-14 (Friday)	1:00 PM	1	A
69	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-14 (Friday)	12:00 PM	1	P
70	HSUL301	Managerial Economics and Financial Accounting	Lecture	Sudesh Garg	2026-08-14 (Friday)	10:15 AM	1	P
71	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-08-14 (Friday)	8:15 AM	2	P
72	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-13 (Thursday)	2:00 PM	1	P
73	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-13 (Thursday)	1:00 PM	1	P
74	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-13 (Thursday)	12:00 PM	1	P
75	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-08-13 (Thursday)	8:15 AM	3	P
76	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-08-12 (Wednesday)	1:00 PM	1	P
77	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-12 (Wednesday)	12:00 PM	1	P
78	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-08-12 (Wednesday)	8:15 AM	3	P
79	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-11 (Tuesday)	1:00 PM	1	A
80	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-11 (Tuesday)	12:00 PM	1	P
81	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-11 (Tuesday)	10:15 AM	1	P
82	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-08-11 (Tuesday)	8:15 AM	2	P
83	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-10 (Monday)	1:00 PM	1	P
84	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-10 (Monday)	12:00 PM	1	P
85	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-10 (Monday)	10:15 AM	1	A
86	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-10 (Monday)	8:15 AM	2	P
87	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-08 (Saturday)	1:00 PM	2	P
88	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-08 (Saturday)	12:00 PM	1	P
89	CSUT330	Industrial Training	Lab	Payal Mittal	2026-08-08 (Saturday)	10:15 AM	1	P
90	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-08 (Saturday)	9:15 AM	1	P
91	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-08 (Saturday)	8:15 AM	1	P
92	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-07 (Friday)	1:00 PM	1	P
93	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-07 (Friday)	12:00 PM	1	P
94	HSUL301	Managerial Economics and Financial Accounting	Lecture	Sudesh Garg	2026-08-07 (Friday)	10:15 AM	1	P
95	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-08-07 (Friday)	8:15 AM	2	P
96	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-06 (Thursday)	2:00 PM	1	P
97	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-06 (Thursday)	1:00 PM	1	P
98	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-06 (Thursday)	12:00 PM	1	P
99	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-08-06 (Thursday)	8:15 AM	3	P
100	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-08-05 (Wednesday)	1:00 PM	1	P
101	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-05 (Wednesday)	12:00 PM	1	P
102	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-08-05 (Wednesday)	8:15 AM	3	P
103	CSUL302	Operating System	Lecture	Sneha Sharma	2026-08-04 (Tuesday)	1:00 PM	1	A
104	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-04 (Tuesday)	12:00 PM	1	A
105	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-04 (Tuesday)	10:15 AM	1	P
106	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-08-04 (Tuesday)	8:15 AM	2	P
107	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-03 (Monday)	1:00 PM	1	A
108	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-08-03 (Monday)	12:00 PM	1	A
109	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-03 (Monday)	10:15 AM	1	P
110	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-03 (Monday)	8:15 AM	2	P
111	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-08-01 (Saturday)	1:00 PM	2	P
112	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-08-01 (Saturday)	12:00 PM	1	P
113	CSUT330	Industrial Training	Lab	Payal Mittal	2026-08-01 (Saturday)	10:15 AM	1	P
114	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-08-01 (Saturday)	9:15 AM	1	P
115	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-08-01 (Saturday)	8:15 AM	1	P
116	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-07-31 (Friday)	1:00 PM	1	P
117	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-07-31 (Friday)	12:00 PM	1	P
118	HSUL301	Managerial Economics and Financial Accounting	Lecture	Sudesh Garg	2026-07-31 (Friday)	10:15 AM	1	P
119	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-07-31 (Friday)	8:15 AM	2	P
120	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-30 (Thursday)	2:00 PM	1	P
121	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-30 (Thursday)	1:00 PM	1	A
122	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-30 (Thursday)	12:00 PM	1	P
123	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-07-30 (Thursday)	8:15 AM	3	P
124	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-07-29 (Wednesday)	1:00 PM	1	P
125	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-29 (Wednesday)	12:00 PM	1	P
126	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-07-29 (Wednesday)	8:15 AM	3	P
127	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-28 (Tuesday)	1:00 PM	1	P
128	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-28 (Tuesday)	12:00 PM	1	P
129	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-28 (Tuesday)	10:15 AM	1	P
130	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-07-28 (Tuesday)	8:15 AM	2	P
131	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-27 (Monday)	1:00 PM	1	A
132	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-27 (Monday)	12:00 PM	1	P
133	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-27 (Monday)	10:15 AM	1	P
134	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-07-27 (Monday)	8:15 AM	2	P
135	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-07-25 (Saturday)	1:00 PM	2	P
136	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-25 (Saturday)	12:00 PM	1	P
137	CSUT330	Industrial Training	Lab	Payal Mittal	2026-07-25 (Saturday)	10:15 AM	1	P
138	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-25 (Saturday)	9:15 AM	1	P
139	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-07-25 (Saturday)	8:15 AM	1	P
140	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-24 (Friday)	1:00 PM	1	P
141	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-07-24 (Friday)	12:00 PM	1	P
142	HSUL301	Managerial Economics and Financial Accounting	Lecture	Sudesh Garg	2026-07-24 (Friday)	10:15 AM	1	P
143	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-07-24 (Friday)	8:15 AM	2	P
144	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-23 (Thursday)	2:00 PM	1	P
145	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-23 (Thursday)	12:00 PM	1	P
146	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-07-23 (Thursday)	8:15 AM	3	P
147	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-07-22 (Wednesday)	1:00 PM	1	A
148	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-22 (Wednesday)	12:00 PM	1	A
149	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-07-22 (Wednesday)	8:15 AM	3	A
150	HSUL301	Managerial Economics and Financial Accounting	Lecture	Sudesh Garg	2026-07-21 (Tuesday)	2:00 PM	1	P
151	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-21 (Tuesday)	1:00 PM	1	P
152	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-21 (Tuesday)	12:00 PM	1	P
153	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-21 (Tuesday)	10:15 AM	1	P
154	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-07-21 (Tuesday)	8:15 AM	2	P
155	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-20 (Monday)	1:00 PM	1	P
156	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-20 (Monday)	12:00 PM	1	P
157	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-20 (Monday)	10:15 AM	1	P
158	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-07-20 (Monday)	8:15 AM	2	P
159	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-07-18 (Saturday)	1:00 PM	2	A
160	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-18 (Saturday)	12:00 PM	1	A
161	CSUT330	Industrial Training	Lab	Payal Mittal	2026-07-18 (Saturday)	10:15 AM	1	A
162	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-18 (Saturday)	9:15 AM	1	A
163	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-07-18 (Saturday)	8:15 AM	1	A
164	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-17 (Friday)	1:00 PM	1	P
165	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-07-17 (Friday)	12:00 PM	1	P
166	HSUL301	Managerial Economics and Financial Accounting	Lecture	Sudesh Garg	2026-07-17 (Friday)	10:15 AM	1	P
167	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-07-17 (Friday)	8:15 AM	2	P
168	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-16 (Thursday)	2:00 PM	1	P
169	CSUL301	Data Structures and Algorithms	Lecture	Ashish Pant	2026-07-16 (Thursday)	1:00 PM	1	P
170	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-16 (Thursday)	12:00 PM	1	P
171	CSUP322	Software Engineering Lab	Lab	Aakriti Sharma	2026-07-16 (Thursday)	8:15 AM	3	P
172	NU99.5	Soft Skills Training	Lab	Shipra Malik	2026-07-15 (Wednesday)	1:00 PM	1	P
173	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-15 (Wednesday)	12:00 PM	1	P
174	CSUP323	Digital Electronics Lab	Lab	Yogendra Kumar Gupta	2026-07-15 (Wednesday)	8:15 AM	3	P
175	HSUL301	Managerial Economics and Financial Accounting	Lecture	Sudesh Garg	2026-07-14 (Tuesday)	2:00 PM	1	P
176	CSUL302	Operating System	Lecture	Sneha Sharma	2026-07-14 (Tuesday)	1:00 PM	1	P
177	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-14 (Tuesday)	12:00 PM	1	P
178	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-14 (Tuesday)	10:15 AM	1	P
179	CSUP321	Programming in Java Lab	Lab	Sarla Jangir	2026-07-14 (Tuesday)	8:15 AM	2	P
180	MAUL301	Statistics and Probability Theory	Lecture	Vijay Kumar Singhal	2026-07-13 (Monday)	1:00 PM	1	P
181	CSUL303	Software Engineering and Project Management	Lecture	Aakriti Sharma	2026-07-13 (Monday)	12:00 PM	1	P
182	CSUL304	Digital Electronics	Lecture	Payal Mittal	2026-07-13 (Monday)	10:15 AM	1	P
183	CSUP320	Data Structures and Algorithms Lab	Lab	Sneha Sharma	2026-07-13 (Monday)	8:15 AM	2	P`;

  /**
   * Parse raw text pasted by user (tab-separated, CSV, space-separated, etc.)
   * Handles both:
   * A) Detailed class-by-class session log (Subject Code, Subject, Hours, Marked P/A)
   * B) Pre-aggregated summary tables (Subject, Held, Attended, %)
   * 
   * @param {string} rawText 
   * @param {boolean} countByHours - If true, uses 'Number of Hours' column; else 1 per session
   * @returns {{success: boolean, subjects: Array, totalRows?: number, type?: string, error?: string}}
   */
  function parsePastedReport(rawText, countByHours = true) {
    if (!rawText || !rawText.trim()) {
      return { success: false, error: "Pasted text is empty. Please paste your attendance table." };
    }

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return { success: false, error: "No valid rows found in pasted text." };
    }

    // Determine row splitting (check tab vs comma vs multiple spaces)
    const sampleLine = lines.find(l => l.includes('\t') || l.includes(',') || l.split(/\s{2,}/).length > 2) || lines[0];
    let delimiter = '\t';
    if (sampleLine.includes('\t')) {
      delimiter = '\t';
    } else if (sampleLine.includes(',')) {
      delimiter = ',';
    } else {
      delimiter = /\s{2,}|\t/; // Multiple spaces or tab
    }

    // Look for header row within the first 15 lines
    let headerIdx = -1;
    let headers = [];
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const parts = lines[i].split(delimiter).map(c => c.trim().toLowerCase());
      if (parts.some(p => /subject|course|paper|code/i.test(p)) && 
          parts.some(p => /marked|status|attended|present|held|conducted|hours|date/i.test(p))) {
        headerIdx = i;
        headers = parts;
        break;
      }
    }

    // If no header detected, try fallback guessing
    if (headerIdx === -1) {
      // Check if line 0 looks like header
      const parts0 = lines[0].split(delimiter).map(c => c.trim().toLowerCase());
      if (parts0.some(p => /code|sub|marked|hours|present/i.test(p))) {
        headerIdx = 0;
        headers = parts0;
      } else {
        // Assume default order: #, Code, Subject, Type, Faculty, Date, Time, Hours, Marked
        headers = ['#', 'subject code', 'subject', 'type', 'faculty', 'date', 'time', 'number of hours', 'marked'];
        headerIdx = -1; // Data starts at line 0
      }
    }

    // Map column indices
    let colCode = -1;
    let colSubject = -1;
    let colType = -1;
    let colFaculty = -1;
    let colHours = -1;
    let colMarked = -1;
    let colHeld = -1;
    let colAttended = -1;
    let colAbsent = -1;
    let colPercent = -1;

    headers.forEach((h, idx) => {
      const clean = h.toLowerCase().replace(/[\r\n\t_]+/g, ' ');
      if (colCode === -1 && /code/i.test(clean)) colCode = idx;
      else if (colSubject === -1 && /subject|course|paper|title/i.test(clean)) colSubject = idx;
      else if (colType === -1 && /type/i.test(clean)) colType = idx;
      else if (colFaculty === -1 && /faculty|teacher|prof/i.test(clean)) colFaculty = idx;
      else if (colHours === -1 && /hour|hrs?|credit|duration/i.test(clean)) colHours = idx;
      else if (colMarked === -1 && /marked|status|p\/a|attend(?!ed)/i.test(clean)) colMarked = idx;
      else if (colHeld === -1 && /held|conducted|total class|total held/i.test(clean)) colHeld = idx;
      else if (colAttended === -1 && /attended|present/i.test(clean)) colAttended = idx;
      else if (colAbsent === -1 && /absent/i.test(clean)) colAbsent = idx;
      else if (colPercent === -1 && /percent|%/i.test(clean)) colPercent = idx;
    });

    // Fallbacks if columns weren't matched explicitly
    if (colSubject === -1 && colCode !== -1 && headers.length > colCode + 1) colSubject = colCode + 1;
    if (colCode === -1 && colSubject !== -1 && colSubject > 0) colCode = colSubject - 1;

    // Check if it is a Class-by-Class log (has marked column or P/A values)
    const isClassLog = colMarked !== -1 || lines.some(l => /\b[PA]\b/i.test(l));

    if (isClassLog) {
      return parseClassByClassLog(lines, headerIdx, delimiter, {
        colCode, colSubject, colType, colFaculty, colHours, colMarked
      }, countByHours);
    } else {
      return parseSummaryTable(lines, headerIdx, delimiter, {
        colCode, colSubject, colHeld, colAttended, colAbsent, colPercent
      });
    }
  }

  function parseClassByClassLog(lines, headerIdx, delimiter, cols, countByHours) {
    const subjectMap = {};
    let validRowHits = 0;

    const start = headerIdx >= 0 ? headerIdx + 1 : 0;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const cells = line.split(delimiter).map(c => c.trim());
      if (cells.length < 3) continue;

      // Extract Code & Name
      let code = '';
      let name = '';

      if (cols.colCode !== -1 && cells[cols.colCode]) {
        code = cells[cols.colCode];
      }
      if (cols.colSubject !== -1 && cells[cols.colSubject]) {
        name = cells[cols.colSubject];
      }

      // If either is missing, heuristically extract
      if (!code && !name) {
        // Try looking at cells[1] and cells[2]
        if (cells[1] && cells[2]) {
          code = cells[1];
          name = cells[2];
        } else if (cells[0] && cells[1]) {
          code = cells[0];
          name = cells[1];
        }
      }
      if (!name && code) name = code;
      if (!code && name) code = name.slice(0, 6).toUpperCase();

      if (!name) continue;

      // Extract hours (e.g. 1, 2, 3)
      let hours = 1;
      if (countByHours) {
        if (cols.colHours !== -1 && cells[cols.colHours]) {
          const parsedH = parseInt(cells[cols.colHours].replace(/[^0-9]/g, ''), 10);
          if (!isNaN(parsedH) && parsedH > 0) hours = parsedH;
        } else {
          // Check cell before last or column with single digit
          for (let c = cells.length - 1; c >= 0; c--) {
            if (/^[1-9]$/.test(cells[c])) {
              hours = parseInt(cells[c], 10);
              break;
            }
          }
        }
      }

      // Extract marked status: 'P', 'A', 'OD', 'Present', 'Absent'
      let marked = '';
      if (cols.colMarked !== -1 && cells[cols.colMarked]) {
        marked = cells[cols.colMarked].trim().toUpperCase();
      } else {
        // Check last cell
        const lastCell = cells[cells.length - 1].trim().toUpperCase();
        if (/^(P|PRESENT|A|ABSENT|OD|L)$/i.test(lastCell)) {
          marked = lastCell;
        }
      }

      // If marked is still empty, search backwards for P or A
      if (!marked) {
        for (let c = cells.length - 1; c >= 0; c--) {
          const val = cells[c].trim().toUpperCase();
          if (val === 'P' || val === 'PRESENT' || val === 'A' || val === 'ABSENT') {
            marked = val;
            break;
          }
        }
      }

      if (!marked) continue; // Skip row if marked status isn't present

      validRowHits++;
      const isPresent = marked === 'P' || marked === 'PRESENT' || marked === 'OD';

      // Group key: Subject Code or Name
      const groupKey = (code || name).toUpperCase();

      if (!subjectMap[groupKey]) {
        subjectMap[groupKey] = {
          id: 'sub_' + Math.random().toString(36).substr(2, 9),
          code: code,
          name: name,
          type: (cols.colType !== -1 && cells[cols.colType]) ? cells[cols.colType] : '',
          faculty: (cols.colFaculty !== -1 && cells[cols.colFaculty]) ? cells[cols.colFaculty] : '',
          attended: 0,
          held: 0,
          attendedSessions: 0,
          heldSessions: 0
        };
      }

      subjectMap[groupKey].held += hours;
      subjectMap[groupKey].heldSessions += 1;

      if (isPresent) {
        subjectMap[groupKey].attended += hours;
        subjectMap[groupKey].attendedSessions += 1;
      }
    }

    const subjects = Object.values(subjectMap);
    if (subjects.length === 0 || validRowHits === 0) {
      return {
        success: false,
        error: "Could not detect subject and P/A marked records from the pasted report. Please ensure the columns include Subject and Marked (P/A)."
      };
    }

    return {
      success: true,
      subjects: subjects,
      totalRows: validRowHits,
      type: "class-by-class"
    };
  }

  function parseSummaryTable(lines, headerIdx, delimiter, cols) {
    const subjects = [];
    const start = headerIdx >= 0 ? headerIdx + 1 : 0;
    const ignoredKeywords = /^(total|grand total|average|avg|summary|overall|signature)/i;

    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const cells = line.split(delimiter).map(c => c.trim());
      if (cells.length < 2) continue;

      let code = cols.colCode !== -1 ? cells[cols.colCode] : '';
      let name = cols.colSubject !== -1 ? cells[cols.colSubject] : cells[0];

      if (!name && code) name = code;
      if (!name || ignoredKeywords.test(name)) continue;

      let held = 0;
      let attended = 0;

      if (cols.colHeld !== -1 && cells[cols.colHeld]) {
        held = parseInt(cells[cols.colHeld].replace(/[^0-9]/g, ''), 10) || 0;
      }
      if (cols.colAttended !== -1 && cells[cols.colAttended]) {
        attended = parseInt(cells[cols.colAttended].replace(/[^0-9]/g, ''), 10) || 0;
      } else if (cols.colAbsent !== -1 && cells[cols.colAbsent] && held > 0) {
        const abs = parseInt(cells[cols.colAbsent].replace(/[^0-9]/g, ''), 10) || 0;
        attended = Math.max(0, held - abs);
      }

      // If held/attended not mapped explicitly, search cells for numbers
      if (held === 0 && attended === 0) {
        const numbers = cells.map(c => parseInt(c.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n) && n > 0);
        if (numbers.length >= 2) {
          // Usually attended is first or held is larger
          if (numbers[0] <= numbers[1]) {
            attended = numbers[0];
            held = numbers[1];
          } else {
            held = numbers[0];
            attended = numbers[1];
          }
        }
      }

      if (held <= 0 && attended <= 0) continue;
      if (attended > held) held = attended;

      subjects.push({
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        code: code || name.slice(0, 6).toUpperCase(),
        name: name,
        attended: attended,
        held: held
      });
    }

    if (subjects.length === 0) {
      return {
        success: false,
        error: "Could not parse summary attendance table. Please check format."
      };
    }

    return {
      success: true,
      subjects: subjects,
      totalRows: subjects.length,
      type: "summary"
    };
  }

  /**
   * Parse an uploaded file (.xlsx, .xls, .csv)
   */
  async function parseFile(file, countByHours = true) {
    try {
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        return parsePastedReport(text, countByHours);
      }

      const buffer = await file.arrayBuffer();
      if (!window.XLSX) {
        throw new Error("Excel parser (SheetJS) is not loaded.");
      }

      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("The Excel file has no sheets.");
      }

      const targetSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(targetSheet);
      return parsePastedReport(csv, countByHours);
    } catch (err) {
      console.error("File parse error:", err);
      return {
        success: false,
        error: err.message || "Failed to parse file."
      };
    }
  }

  function getRawUserSampleReport() {
    return RAW_USER_SAMPLE_REPORT;
  }

  return {
    parsePastedReport: parsePastedReport,
    parseFile: parseFile,
    getRawUserSampleReport: getRawUserSampleReport
  };
})();

window.ErpParser = ErpParser;
