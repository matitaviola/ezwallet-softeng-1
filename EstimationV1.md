# Project Estimation - CURRENT
Date: 26/04/23

Version: 1.0


# Estimation approach
Consider the EZWallet  project in CURRENT version (as received by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   | 10 (modules)  |             
|  A = Estimated average size per class, in LOC       |   85 | 
| S = Estimated size of project, in LOC (= NC * A) | 850 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |              85                        |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 2550 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |     85ph/(4p)/(8h/d)/(5d/w) =  1 week (actually, a little more of 1/2 week) |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    | 16ph |
| GUI prototype | 16ph |
|design document |10h|
|code |40ph|
| unit tests |16ph|
| api tests |8ph|
| management documents  |16ph|


# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
Defining workflow | 4ph
Researching tools,techniques and algorithms|4ph
Completing Requirements document | 16ph
Estimating the project cost | 4ph
Making GUI prototype | 16ph
Completing the design document | 10ph
Implementation | 40ph
Testing | 24ph
Completing the management document | 16 ph
| | |

###
![Gantt_chart](/Images/V1/Gantt_chart.jpg)



# Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size | 85 ph| 3-4 days |
| estimate by product decomposition | 122 ph| 1 week and 1-2 day |
| estimate by activity decomposition | 134 ph| 1 week and 1-2 day |

Possible reasons for the differences:
If we interpret LOC as the time needed just to write the code, it result as just a small part of the entire project, and fails to take into account the work around the writing of the code (that is, defining what we need the code for). 
Even when we treat LOCs like the effort on a single line of code represents all the work needed to write that line in that specific way (including the effort starting from requirements to the deployment), many factors (such as the choice of the programming language, or the verbosity of the programmer) brings us to a misleading result.
On the other hand, the other two methods gives us two far more similar results (with a difference of 16ph, that considering our team of 4 people equals to 1 calendar day). 
Note that the calendar time of the two last estimation method isn't a direct conversion from the person/hours to calendar time. We also took into account eventual breaks and fatigue.




