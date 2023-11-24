# Requirements Document - current EZWallet

Date: 26/04/23

Version: V1 - description of EZWallet in CURRENT form (as received by teachers)

 
| Version number | Change |
| ----------------- |:-----------|
| 0.1 | Added everything except GUI | 
| 0.2 | Removed references to admin |
| 0.3 | Some grammar and numbering mistakes have been corrected|
|1.0| Ready to merge |


# Contents

- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
	+ [Context Diagram](#context-diagram)
	+ [Interfaces](#interfaces) 
	
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
	+ [Functional Requirements](#functional-requirements)
	+ [Non functional requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
	+ [Use case diagram](#use-case-diagram)
	+ [Use cases](#use-cases)
    	+ [Relevant scenarios](#relevant-scenarios)
- [Glossary](#glossary)
- [System design](#system-design)
- [Deployment diagram](#deployment-diagram)

# Informal description
EZWallet (read EaSy Wallet) is a software application designed to help individuals and families keep track of their expenses. Users can enter and categorize their expenses, allowing them to quickly see where their money is going. EZWallet is a powerful tool for those looking to take control of their finances and make informed decisions about their spending.



# Stakeholders


| Stakeholder name  | Description | 
| ----------------- |:-----------:|
|  User     | Person that wants to manage their expenses or their family’s             | 

# Context Diagram and interfaces

## Context Diagram
![context_diagram](./Images/V1/Context_v1.png)

## Interfaces

| Actor | Logical Interface | Physical Interface  |
| ------------- |:-------------:| -----:|
|   User     | Graphical User Interface   | Smartphone, PC|

# Stories and personas

**Persona 1**: middle-class blue-collar worker, male, family man, 48yo 

**Story 1**: manages his family’s finances. Wants to keep track of different types of expenses in order to save some money for the children’s education 

**Persona 2**: full-time off-campus student, no income (parent’s allowance), female, 22yo 

**Story 2**: needs to manage the allowance from her parents, has to keep track of her spending (rent, food, university books) to avoid breaking the bank.  

**Persona 3**: male, 27yo, freshly graduated, odd job, medium-low income, lives with parents 

**Story 3**: wants to keep track of his unnecessary spending (es: categorized as "leisure") for a while in order to save up money to move out 

**Persona 4**: female, 55yo, medium income, married with no children 

**Story 4**: wants to take note on spending to set something aside for retirement  

**Persona 5**: male, 16yo, student, lives with parents, does babysitting sometimes 

**Story 5**: wants to track his paychecks and money spent going out with friends to afford the new gaming console 

# Functional and non functional requirements

## Functional Requirements

| ID        | Description  |
| ------------- |:-------------:| 
|  **FR1**  | **Manage User**|
| 1.1 | Create Account |
| 1.2 | Log in |
| 1.3 | Log out| 
| 1.4 | Retrieve user| 
| 1.5 | Retrieve List of Users  |
|  **FR2**     | **Manage Transaction**   |
| 2.1 | Define transaction |
| 2.2 | Read Transaction |
| 2.3 | Delete Transaction |
| 2.4 | Get all labels|
| **FR3**  | **Manage Categories**| 
|3.1 | Define Category |
|3.2 | Read existing Categories |

## Non Functional Requirements

| ID        | Type (efficiency, reliability, ..)           | Description  | Refers to |
| ------------- |:-------------:| :-----:| -----:|
|  NFR1    | Security | User account should be protected by a password| FR: 1.2 |
|  NFR2     | Availability  |The downtime of the server should be lower than 5h/y   | The whole application |
| NFR3 | Efficiency  |User’s functions should not require more than 1s to complete  | FR: 1.2, 1.3, 3.1, 3.3, 3.4  | 
|NFR4 | Usability | User’s interface should be easy to understand. A maximum of 10 minutes should be required for an inexperienced user to grasp the functionalities | GUI|


# Use case diagram and use cases


## Use case diagram
![use_case](./Images/V1/Use_v1.png)

### Use case 1, UC1: Register
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | User has a mail address |
|  Post condition     | User has an account in the application  |
|  Nominal Scenario     | A new user inserts its mail, username and password, register itself  |
|  Variants     | - |
|  Exceptions     | The selected mail or username is already present in the user’s database |

##### Scenario 1.1 

| Scenario 1.1 | |
| ------------- |:-------------:| 
|  Precondition     | User possesses an email address |
|  Post condition     | User is now registered in the application  |
| Step#        | Description  |
|  1     | User starts application (reaches website via browser)  |  
|  2     | User selects the register option  |
|  3     | User inserts mail, username and a chosen password in the respective fields, submits the data |
| 4 | System checks if an account with that mail exists |
| 5 | No existing account found, confirmation of registration is shown to the user |

##### Scenario 1.2
| Scenario 1.2 | |
| ------------- |:-------------:| 
|  Precondition     | User possesses an email address already registered in the app |
|  Post condition     | An error message is shown  |
| Step#        | Description  |
|  1     | User starts application (reaches website via browser)  |  
|  2     | User selects the register option  |
|  3     | User inserts mail, username and a chosen password in the respective fields |
| 4 | System checks if an account with that mail exists |
| 5 | An existing account is found, error message returned |


### Use case 2, UC2: Log In
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | User has an account|
|  Post condition     | User is logged in the applications |
|  Nominal Scenario     |A user inserts its mail and password to log in |
|  Variants     | - |
|  Exceptions     | The selected mail is not present in the database OR the mail exists but the password is wrong OR the user is already logged in  |
##### Scenario 2.1
| Scenario 2.1 | |
| ------------- |:-------------:| 
|  Precondition     | User has an account|
|  Post condition     | User is now logged in |
| Step#        | Description  |
|  1     | User asks to login |  
|  2     | System asks for mail and password |
|  3     | System checks, mail and password correct, user is authorized |
| 4 | User can retrieve it's information |
##### Scenario 2.2
| Scenario 2.2 | |
| ------------- |:-------------:| 
|  Precondition     | User is not yet registered |
|  Post condition     | Error message is shown |
| Step#        | Description  |
|  1     | User asks to login |  
|  2     | System asks for mail and password |
|  3     | System checks mail and password, the mail is not associated to any account|
| 4 | A message alerting "you need to register" is shown|
##### Scenario 2.3
| Scenario 2.3 | |
| ------------- |:-------------:| 
|  Precondition     | User has an account|
|  Post condition     | Error message is shown |
| Step#        | Description  |
|  1     | User asks to login |  
|  2     | System asks for mail and password |
|  3     | System checks mail and password, the password is not the one associated with the email |
| 4 | A message alerting for "wrong credentials" is shown|
##### Scenario 2.4
| Scenario 2.4 | |
| ------------- |:-------------:| 
|  Precondition     | User is already logged in |
|  Post condition     | Error message is shown |
| Step#        | Description  |
|  1     | User asks to login | 
| 2 |System detects that the user is already logged in| 
| 2 | A message alerting that the user is already logged is shown|

### Use case 3, UC3: Log Out
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | User is logged out of the applications |
|  Nominal Scenario     |A logged in user logs out from the account|
|  Variants     | - |
|  Exceptions     | The user is already logged out |

##### Scenario 3.1
| Scenario 3.1 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | User is now logged out|
| Step#        | Description  |
|  1     | User asks to log out|  
|  2     | System logs the user out |

##### Scenario 3.2
| Scenario 3.2 | |
| ------------- |:-------------:| 
|  Precondition     | User is not logged in |
|  Post condition     | Error message is shown|
| Step#        | Description  |
|  1     | User asks to log out|  
|  2     | System shows an error message informing of the user that they're already logged out |

### Use case 4, UC4: Manage Categories
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | - |
|  Nominal Scenario     |The user is able to Create and Read categories|
|  Variants     | - |
|  Exceptions     | - |
##### Scenario 4.1
| Scenario 4.1 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | New Category is added to user’s  |
| Step#        | Description  |
|  1     | User asks to create a new category|  
|  2     | System asks for category's data (type, colour) |
| 3 | System creates a new category associated with the user |
##### Scenario 4.2
| Scenario 4.2 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | User can now read all of their categories' data (type, colour) |
| Step#        | Description  |
|  1     | User asks to get categories |  
|  2     | System retrieves all the categories data |
| 3 | System shows categories to the user |

### Use case 5, UC5: Manage Transaction
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | - |
|  Nominal Scenario     |The user is able to Create, Read and Delete transactions, and read the associated labels |
|  Variants     | - |
|  Exceptions     | The user is already logged out |
##### Scenario 5.1
| Scenario 5.1 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | New Transaction is added to user’s transaction  |
| Step#        | Description  |
|  1     | User asks to create a new transaction |  
|  2     | System asks for transaction data (name, amount, type) |
| 3 | System creates a new Transaction associated with the user |
##### Scenario 5.2
| Scenario 5.2 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     |User can read all of the transactions' data (name, amount, type) |
| Step#        | Description  |
|  1     | User asks to read their transactions |  
|  2     | System retrieves all user’s transactions and shows them to the user |
##### Scenario 5.3
| Scenario 5.3 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     |Removed transaction no longer present in user’s |
| Step#        | Description  |
|  1     | User asks to delete a transaction  |  
|  2     | System asks for transaction id |
| 3 | System removes transaction from user’s transaction list |
##### Scenario 5.4
| Scenario 5.4 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     |User can read their labels (transaction + category of same type) |
| Step#        | Description  |
|  1     | User asks to read labels |  
|  2     | System retrieves transaction and their categories |
| 3 | System shows labels to user |
### Use case 6, UC6: Retrieve Users' information
| Actors Involved        | User |
| ------------- |:-------------:| 
|  Precondition     | - |
|  Post condition     | - |
|  Nominal Scenario     |The user is able to read it's own data or the list of other user's accounts information|
|  Variants     | - |
|  Exceptions     | - |
##### Scenario 6.1
| Scenario 6.1 | |
| ------------- |:-------------:| 
|  Precondition     | User is logged in |
|  Post condition     | User's own information are available  |
| Step#        | Description  |
|  1     | User asks to retrieve it's information |  
|  2     | System finds the user's information |
| 3 | System displays the user's information |
##### Scenario 6.2
| Scenario 6.2 | |
| ------------- |:-------------:| 
|  Precondition     | - |
|  Post condition     | All the users' information are available to the user |
| Step#        | Description  |
|  1     | User asks to retrieve all the user's account information |  
|  2     | System retrieves the accounts data list |
|3 | System displays the list |

# Glossary

![Glossary](./Images/V1/Glossary_v1.png)
# System Design

![System](./Images/V1/System_v1.png)
# Deployment Diagram 

![Deploy](./Images/V1/Deployment_v1.png)



