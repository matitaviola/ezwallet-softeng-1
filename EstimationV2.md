# Project Estimation - FUTURE
Date: 26/04/23

Version: 1.0


# Estimation approach
Consider the EZWallet  project in FUTURE version (as proposed by the team), assume that you are going to develop the project INDEPENDENT of the deadlines of the course
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |  12                           |             
|  A = Estimated average size per class, in LOC       |   90                         | 
| S = Estimated size of project, in LOC (= NC * A) | 1080|
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |                 108                  |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 3240 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |           108ph/(4p)/(8h/d)/(5d/w) = 1 week (a little more than half a week)          |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document     |24| 
| GUI prototype |24| 
|design document |16|
|code |60|
| unit tests |24|
| api tests |16|
| management documents  |20|



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|Defining workflow |6 |
|Researching tools,techniques,algorithms|8|
|Completing Requirements document|20|
|Estimating the project cost|6|
|Making GUI prototype|24|
|Completing the design document|16|
|Implementation|60|
|Testing|40|
|Completing the management document|20|
###
![Gant_chart](/Images/V2/Gantt_chart_v2.jpg)

# Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size |108ph|1 week
| estimate by product decomposition |184ph|2 weeks and 1-2 days
| estimate by activity decomposition |200ph|2 weeks and 1-2 days

Possible reasons for the differences:
Just as in EstimationV1, if we interpret LOC as the time needed just to write the code, it fails to take into account the work behind the simple writing of the code. 
Even when we treat LOCs like the effort on a single line of code represents all the work needed to write that line in that specific way (including the effort starting from requirements to the deployment), many factors (such as the choice of the programming language, or the verbosity of the programmer) lead us to an underestimated result.
On the other hand, the other two methods gives us two far more similar results (with a difference of 16ph, that considering our team of 4 people equals to 1 calendar day). 
Again, please note that the calendar time of the two last estimation method isn't a direct conversion from the person/hours to calendar time. We also took into account eventual breaks and fatigue.


