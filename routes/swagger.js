/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
 // SWAGGER FOR LEADS
/**
 * @swagger
 * /api/leads/:
 *   get:
 *     summary: Retrieve all leads
 *     description: Fetch all leads stored in the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved leads.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */

/**
 * @swagger
 * /api/leads/getcampaign:
 *   get:
 *     summary: Retrieve all campaigns
 *     description: Fetch all leads stored in the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */

/**
 * @swagger
 * /api/leads/getleads/{campaign}:
 *   get:
 *     summary: Get leads data in MongoDB
 *     description: This API is used to get lead data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: campaign
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */

/**
 * @swagger
 * /api/leads/:
 *   post:
 *     summary: Insert new leads data
 *     description: This API is used to add new leads to MongoDB.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     responses:
 *       200:
 *         description: Leads added successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Leads added successfully."
 *       400:
 *         description: Bad Request - Invalid input.
 *         content:
 *           application/json:
 *             example:
 *               error: "Invalid request data."
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to add the leads. Please try again later."
 */

/**
 * @swagger
 * /api/leads/assign/{campaignid}:
 *   put:
 *     summary: Assign leads equally to users
 *     description: This API is used to assign leads equally to users
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */


/**
 * @swagger
 * /api/leads/assignlead/{leadId}/{userId}:
 *   put:
 *     summary: assignleads to users
 *     description: This API is used to assignleads to users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: data of the leadsprofile to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
/**
 * @swagger
 * /api/leads/{leadId}/status:
 *   put:
 *     summary: update lead status
 *     description: This API is used to update lead status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: status of the leads is  updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */

/**
 * @swagger
 * /api/leads/{leadId}/stages:
 *   put:
 *     summary: update lead stages
 *     description: This API is used to update lead stages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: stage of the leads is  updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
/**
 * @swagger
 * /api/leads/leads/{id}:
 *   get:
 *     summary: get leadsbyid data in MongoDB
 *     description: This API is used to get lead data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: leads
 *         required: true
 *         description: get leads byid 
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: get successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
/**
 * @swagger
* /api/leads/deleteall:
*   delete:
*     summary: To delete record from mongodb
*     description: This API is used to delete campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: leads
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Data is deleted.
*/
/**
 * @swagger
 * /api/leads/putleads/{id}:
 *   put:
 *     summary: update leads
 *     description: This API is used to update leads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
/**
 * @swagger
 * /api/leads/leadsbycampaign/{campaignid}:
 *   get:
 *     summary: get leads on basics of campaign data in MongoDB
 *     description: This API is used to get lead data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: leads
 *         required: true
 *         description: get leads on basics of campaign
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: get successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
/**
 * @swagger
 * /api/leads/notes/{leadId}:
 *   put:
 *     summary: add notes to leads
 *     description: This API is used to add notes to leads
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */
/**
 * @swagger
* /api/leads/deletenotes:
*   delete:
*     summary: To delete record from mongodb
*     description: This API is used to delete campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: leads
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Data is deleted.
*/

// SWAGGER FOR CAMPAIGN

/**
 * @swagger
 * components:
 *   schemas:
 *     Campaign:
 *       type: object
 *       required:
 *         - company
 *         - User
 *         - name
 *       properties:
 *         company:
 *           type: string
 *           description: The ID of the company associated with the campaign.
 *           example: "60b8f5c9fc8b6e001f5c8d9d"
 *         User:
 *           type: string
 *           description: The ID of the user (sales representative) associated with the campaign.
 *           example: "60b8f5c9fc8b6e001f5c8d9e"
 *         Pipeline:
 *           type: string
 *           description: The ID of the pipeline associated with the campaign.
 *           example: "60b8f5c9fc8b6e001f5c8d9f"
 *         name:
 *           type: string
 *           description: The name of the campaign.
 *           example: "Summer Sale Campaign"
 *         description:
 *           type: string
 *           description: A description of the campaign.
 *           example: "A special summer sale campaign targeting new customers."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the campaign was created.
 *           example: "2024-12-28T14:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the campaign was last updated.
 *           example: "2024-12-28T14:00:00Z"
 */

/**
 * @swagger
 * tags:
 *   - name: Campaign
 *     description: Operations related to campaigns
 */

/**
 * @swagger
 * /api/campaign/createcampaign:
 *   post:
 *     summary: Insert new campaign data
 *     description: >
 *       This API is used to add a new campaign to MongoDB.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Campaigns
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
 *     responses:
 *       200:
 *         description: Campaign added successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: "Campaign added successfully."
 *       400:
 *         description: Bad Request - Invalid input.
 *         content:
 *           application/json:
 *             example:
 *               error: "Invalid request data."
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to add the campaign. Please try again later."
 */
// Route to get all campaigns by pipeline ID
/**
 * @swagger
* /api/campaign/campaigns/pipeline/{pipelineId}:
*   get:
*     summary: To get all campaigns from MongoDB
*     description: This API is used to fetch all campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: pipelineId
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
 *     security:
 *       - bearerAuth: []
*     responses:
*       200:
*         description: Successfully fetched campaigns from MongoDB.
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 $ref: '#/components/schemas/Campaign'
*/
/**
 * @swagger
 * /api/campaign/getcampaign:
 *   get:
 *     summary: Retrieve all campaigns
 *     description: Fetch all campaigns stored in the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 */
/**
 * @swagger
 * /api/campaign/updatecampaign/{campaignid}:
 *   put:
 *     summary: Update campaign data in MongoDB
 *     description: This API is used to update campaign data in MongoDB.
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: ID of the campaign to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Campaign'
  *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Campaign'
 */
/**
 * @swagger
* /api/campaign/deletecampaign/{campaignid}:
*   delete:
*     summary: To delete record from mongodb
*     description: This API is used to delete campaigns from MongoDB.
*     parameters:
*       - in: path
*         name: pipelineId
*         required: true
*         description: Numeric ID required
*         schema:
*           type: integer
  *     security:
 *       - bearerAuth: []
*     responses:
*       200:
*         description: Data is deleted.
*/

// SWAGGER FOR COMPANY

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: API for managing companies and their modules
 */

/**
 * @swagger
 * /api/companies/:
 *   get:
 *     summary: Retrieve a company by its ID
 *     description: Fetch the details of a specific company using its unique ID.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found.
 */

/**
 * @swagger
 * /api/companies/getall:
 *   get:
 *     summary: Retrieve all companies
 *     description: Fetch a list of all registered companies in the system.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all companies.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 */

/**
 * @swagger
 * /api/companies/:
 *   post:
 *     summary: Create a new company
 *     description: Adds a new company to the system by providing necessary details.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Company created successfully.
 *       400:
 *         description: Bad request, invalid input data.
 */

/**
 * @swagger
 * /api/companies/:
 *   put:
 *     summary: Update an existing company
 *     description: Modify the details of an existing company.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Company updated successfully.
 *       403:
 *         description: Forbidden. Not authorized to update the company.
 *       404:
 *         description: Company not found.
 */

/**
 * @swagger
 * /api/companies/modules/{id}:
 *   put:
 *     summary: Update a company's module settings
 *     description: Modify the module settings (Customer, Lead, Pipeline, Finance, Documentation) for a specific company.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Customer:
 *                 type: boolean
 *               lead:
 *                 type: boolean
 *               pipeline:
 *                 type: boolean
 *               finance:
 *                 type: boolean
 *               documentation:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Module updated successfully.
 *       404:
 *         description: Company not found.
 *       500:
 *         description: Server error while updating modules.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Company ID
 *         name:
 *           type: string
 *           description: Company name
 *         Module:
 *           type: object
 *           properties:
 *             Customer:
 *               type: boolean
 *             lead:
 *               type: boolean
 *             pipeline:
 *               type: boolean
 *             finance:
 *               type: boolean
 *             documentation:
 *               type: boolean
 *       required:
 *         - name
 */

// SWAGGER FOR CUSTOMER

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: API for managing customer data
 */

/**
 * @swagger
 * /api/customers/createcustomer:
 *   post:
 *     summary: Create a new customer
 *     description: Adds a new customer to the system with the provided details.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the customer
 *               email:
 *                 type: string
 *                 description: Email address of the customer
 *               phone:
 *                 type: string
 *                 description: Contact number of the customer
 *               address:
 *                 type: string
 *                 description: Customer's address
 *     responses:
 *       201:
 *         description: Customer created successfully.
 *       400:
 *         description: Bad request, invalid input data.
 */

/**
 * @swagger
 * /api/customers/getcustomers:
 *   get:
 *     summary: Retrieve all customers
 *     description: Fetch a list of all customers in the system.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all customers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Customer ID
 *                   name:
 *                     type: string
 *                     description: Customer's name
 *                   email:
 *                     type: string
 *                     description: Customer's email
 *                   phone:
 *                     type: string
 *                     description: Customer's phone number
 *                   address:
 *                     type: string
 *                     description: Customer's address
 */

/**
 * @swagger
 * /api/customers/getcustomer/{customerId}:
 *   get:
 *     summary: Retrieve customer details by ID
 *     description: Fetch the details of a specific customer by their unique ID.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Successfully retrieved customer details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Customer ID
 *                 name:
 *                   type: string
 *                   description: Customer's name
 *                 email:
 *                   type: string
 *                   description: Customer's email
 *                 phone:
 *                   type: string
 *                   description: Customer's phone number
 *                 address:
 *                   type: string
 *                   description: Customer's address
 *       404:
 *         description: Customer not found.
 */

/**
 * @swagger
 * /api/customers/updatecustomer/{customerId}:
 *   put:
 *     summary: Update customer details
 *     description: Modify the details of an existing customer by their unique ID.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Customer's name
 *               email:
 *                 type: string
 *                 description: Customer's email address
 *               phone:
 *                 type: string
 *                 description: Customer's phone number
 *               address:
 *                 type: string
 *                 description: Customer's address
 *     responses:
 *       200:
 *         description: Customer details updated successfully.
 *       400:
 *         description: Invalid input data.
 *       404:
 *         description: Customer not found.
 */

/**
 * @swagger
 * /api/customers/deletecustomer/{customerId}:
 *   delete:
 *     summary: Delete a customer by ID
 *     description: Removes a customer from the system by their unique ID.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully.
 *       404:
 *         description: Customer not found.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Customer ID
 *         name:
 *           type: string
 *           description: Customer's name
 *         email:
 *           type: string
 *           description: Customer's email address
 *         phone:
 *           type: string
 *           description: Customer's phone number
 *         address:
 *           type: string
 *           description: Customer's address
 *       required:
 *         - name
 *         - email
 */

//  SWAGGER FOR DOCUMENTATION

/**
 * @swagger
 * tags:
 *   name: Tasks and Stages
 *   description: API for managing tasks and stages for follow-ups
 */

/**
 * @swagger
 * /api/stage:
 *   post:
 *     summary: Create a new stage
 *     description: Adds a new stage to the system for managing the workflow of tasks.
 *     tags: [Tasks and Stages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the stage (e.g., "Initial Contact", "Follow-up")
 *               description:
 *                 type: string
 *                 description: Detailed description of the stage
 *               order:
 *                 type: integer
 *                 description: The order in which this stage appears in the workflow
 *     responses:
 *       201:
 *         description: Stage created successfully.
 *       400:
 *         description: Bad request, invalid input data.
 */

/**
 * @swagger
 * /api/task:
 *   post:
 *     summary: Create a new task
 *     description: Adds a new task to the system for a follow-up process.
 *     tags: [Tasks and Stages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the task (e.g., "Call customer", "Send email")
 *               description:
 *                 type: string
 *                 description: Detailed description of the task
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: The due date for the task
 *               stageId:
 *                 type: string
 *                 description: The ID of the stage the task belongs to
 *               assignedTo:
 *                 type: string
 *                 description: The ID of the user to whom the task is assigned
 *     responses:
 *       201:
 *         description: Task created successfully.
 *       400:
 *         description: Bad request, invalid input data.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Stage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the stage
 *         name:
 *           type: string
 *           description: The name of the stage
 *         description:
 *           type: string
 *           description: Detailed description of the stage
 *         order:
 *           type: integer
 *           description: The order number for the stage in the workflow
 *       required:
 *         - name
 *         - order
 *     
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the task
 *         title:
 *           type: string
 *           description: Title of the task
 *         description:
 *           type: string
 *           description: Detailed description of the task
 *         dueDate:
 *           type: string
 *           format: date
 *           description: The due date for the task
 *         stageId:
 *           type: string
 *           description: The ID of the stage the task is associated with
 *         assignedTo:
 *           type: string
 *           description: The ID of the user to whom the task is assigned
 *       required:
 *         - title
 *         - dueDate
 *         - stageId
 */
 
// SWAGGER FOR EXCEL FILE UPLOAD

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: API for managing leads and uploading lead data
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload and process leads from an Excel file
 *     description: Upload an Excel file containing leads' information. The system will validate the leads, check for duplicates, and store valid leads in the database. Existing customers are matched by phone number, and existing leads are checked to prevent duplication.
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The Excel file containing the lead information
 *               source:
 *                 type: string
 *                 description: The source of the leads (e.g., "Website", "Ad Campaign")
 *               campaign:
 *                 type: string
 *                 description: The campaign associated with the leads
 *               campaignid:
 *                 type: string
 *                 description: The unique campaign ID associated with the leads
 *     responses:
 *       200:
 *         description: Leads processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Status message indicating the success of the operation
 *                 duplicates:
 *                   type: array
 *                   description: List of duplicate leads
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *       400:
 *         description: No file uploaded or invalid file format.
 *       500:
 *         description: An error occurred while processing the file.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the lead
 *         name:
 *           type: string
 *           description: Name of the lead
 *         email:
 *           type: string
 *           description: Email address of the lead
 *         phone:
 *           type: string
 *           description: Phone number of the lead
 *         status:
 *           type: string
 *           description: Status of the lead (e.g., "New")
 *         source:
 *           type: string
 *           description: The source of the lead
 *         campaign:
 *           type: string
 *           description: The campaign associated with the lead
 *         campaignid:
 *           type: string
 *           description: The unique campaign ID
 *         company:
 *           type: string
 *           description: The company ID associated with the lead
 *         assignedTo:
 *           type: string
 *           description: The ID of the user the lead is assigned to
 *         district:
 *           type: string
 *           description: The district information of the lead
 *         additionalFields:
 *           type: object
 *           description: Additional fields for the lead (if any)
 */

// SWAGGER FOR FOLLOWUPROUTES

/**
 * @swagger
 * tags:
 *   name: Lead Follow-ups
 *   description: API for managing follow-ups related to leads
 */

/**
 * @swagger
 * /api/:
 *   post:
 *     summary: Create a new follow-up
 *     description: Creates a follow-up record for a lead, including details like next follow-up date, status, and notes.
 *     tags: [Lead Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead for which the follow-up is being created
 *               nextFollowUpDate:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time for the next follow-up
 *               status:
 *                 type: string
 *                 description: The current status of the follow-up (e.g., "Pending", "Completed")
 *               notes:
 *                 type: string
 *                 description: Additional notes related to the follow-up
 *     responses:
 *       201:
 *         description: Follow-up created successfully.
 *       400:
 *         description: Bad request, invalid input data.
 */

/**
 * @swagger
 * /api/{leadId}:
 *   get:
 *     summary: Get all follow-ups for a lead
 *     description: Retrieves all follow-up records for a specific lead by lead ID.
 *     tags: [Lead Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead to get follow-ups for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of follow-ups for the specified lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FollowUp'
 *       404:
 *         description: Lead not found.
 */

/**
 * @swagger
 * /api/:
 *   get:
 *     summary: Get all follow-ups
 *     description: Retrieves all follow-up records in the system.
 *     tags: [Lead Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all follow-ups.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FollowUp'
 */

/**
 * @swagger
 * /api/byId/{followUpId}:
 *   get:
 *     summary: Get a specific follow-up by ID
 *     description: Retrieves a specific follow-up record by follow-up ID.
 *     tags: [Lead Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         description: The ID of the follow-up to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow-up details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FollowUp'
 *       404:
 *         description: Follow-up not found.
 */

/**
 * @swagger
 * /api/update/{followUpId}:
 *   put:
 *     summary: Update a follow-up
 *     description: Updates a follow-up record with new details like next follow-up date, status, and notes.
 *     tags: [Lead Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         description: The ID of the follow-up to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nextFollowUpDate:
 *                 type: string
 *                 format: date-time
 *                 description: The new date and time for the next follow-up
 *               status:
 *                 type: string
 *                 description: The new status of the follow-up (e.g., "Pending", "Completed")
 *               notes:
 *                 type: string
 *                 description: Additional notes related to the follow-up
 *     responses:
 *       200:
 *         description: Follow-up updated successfully.
 *       400:
 *         description: Bad request, invalid data.
 *       404:
 *         description: Follow-up not found.
 */

/**
 * @swagger
 * /api/delete/{followUpId}:
 *   delete:
 *     summary: Delete a follow-up
 *     description: Deletes a specific follow-up record by follow-up ID.
 *     tags: [Lead Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         description: The ID of the follow-up to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow-up deleted successfully.
 *       404:
 *         description: Follow-up not found.
 */

/**
 * @swagger
 * /api/delete-with-no-lead:
 *   delete:
 *     summary: Delete follow-ups without a lead ID
 *     description: Deletes all follow-up records that do not have an associated lead ID.
 *     tags: [Lead Follow-ups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Follow-ups without lead IDs deleted successfully.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FollowUp:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the follow-up
 *         leadId:
 *           type: string
 *           description: The ID of the lead associated with the follow-up
 *         nextFollowUpDate:
 *           type: string
 *           format: date-time
 *           description: The scheduled date for the next follow-up
 *         status:
 *           type: string
 *           description: The current status of the follow-up (e.g., "Pending", "Completed")
 *         notes:
 *           type: string
 *           description: Any notes related to the follow-up
 *       required:
 *         - leadId
 *         - nextFollowUpDate
 *         - status
 */

// SWAGGER FOR INVOICE ROUTE

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: API for managing invoices
 */

/**
 * @swagger
 * /api/invoice/:
 *   post:
 *     summary: Create a new invoice
 *     description: Creates a new invoice for a lead with details like amount, due date, and status.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead to which the invoice is associated
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The total amount of the invoice
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: The due date for the invoice payment
 *               status:
 *                 type: string
 *                 description: The current status of the invoice (e.g., "Pending", "Paid")
 *     responses:
 *       201:
 *         description: Invoice created successfully.
 *       400:
 *         description: Bad request, invalid data.
 */

/**
 * @swagger
 * /api/invoice/get:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieves all invoices in the system.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all invoices.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */

/**
 * @swagger
 * /api/invoice/{id}:
 *   get:
 *     summary: Get a specific invoice by ID
 *     description: Retrieves an invoice by its unique ID.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the invoice to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Invoice not found.
 */

/**
 * @swagger
 * /api/invoice/bylead/{leadId}:
 *   get:
 *     summary: Get invoices by lead ID
 *     description: Retrieves all invoices associated with a specific lead ID.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead for which to fetch the invoices
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of invoices for the specified lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: No invoices found for the specified lead.
 */

/**
 * @swagger
 * /api/invoice/{id}:
 *   put:
 *     summary: Update an invoice
 *     description: Updates the details of an existing invoice, such as amount, due date, and status.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the invoice to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The updated total amount of the invoice
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: The updated due date for the invoice
 *               status:
 *                 type: string
 *                 description: The updated status of the invoice
 *     responses:
 *       200:
 *         description: Invoice updated successfully.
 *       400:
 *         description: Invalid data provided.
 *       404:
 *         description: Invoice not found.
 */

/**
 * @swagger
 * /api/invoice/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     description: Deletes a specific invoice by its ID.
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the invoice to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice deleted successfully.
 *       404:
 *         description: Invoice not found.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the invoice
 *         leadId:
 *           type: string
 *           description: The ID of the lead associated with the invoice
 *         amount:
 *           type: number
 *           format: float
 *           description: The total amount of the invoice
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: The due date for the invoice payment
 *         status:
 *           type: string
 *           description: The current status of the invoice (e.g., "Pending", "Paid")
 *       required:
 *         - leadId
 *         - amount
 *         - dueDate
 *         - status
 */

// SWAGGER FOR LEAD ACTIVITY ROUTES

/**
 * @swagger
 * tags:
 *   name: Lead Activities
 *   description: API for managing lead activities
 */

/**
 * @swagger
 * /api/lead-activity/:
 *   post:
 *     summary: Create a new lead activity
 *     description: Creates a new activity for a lead.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead for which the activity is created
 *               activityType:
 *                 type: string
 *                 description: The type of activity (e.g., "call", "email", "meeting")
 *               description:
 *                 type: string
 *                 description: A brief description of the activity
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time when the activity occurred
 *     responses:
 *       201:
 *         description: Lead activity created successfully.
 *       400:
 *         description: Bad request, invalid data.
 */

/**
 * @swagger
 * /api/lead-activity/{leadId}:
 *   get:
 *     summary: Get all activities for a specific lead
 *     description: Retrieves all activities associated with a specific lead ID.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead whose activities you want to fetch
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities for the specified lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadActivity'
 *       404:
 *         description: No activities found for the specified lead.
 */

/**
 * @swagger
 * /api/lead-activity/filter/{leadId}:
 *   get:
 *     summary: Get filtered activities for a specific lead
 *     description: Retrieves activities for a lead filtered by specified criteria (e.g., type of activity).
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead whose filtered activities you want to fetch
 *         schema:
 *           type: string
 *       - in: query
 *         name: activityType
 *         description: The type of activity to filter by (e.g., "call", "email", "meeting")
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered list of activities for the specified lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadActivity'
 *       404:
 *         description: No activities found matching the filter criteria.
 */

/**
 * @swagger
 * /api/lead-activity/{leadId}:
 *   delete:
 *     summary: Delete all activities for a specific lead
 *     description: Deletes all activities associated with a specific lead ID.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead whose activities you want to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All activities for the lead were deleted successfully.
 *       404:
 *         description: No activities found for the specified lead.
 */

/**
 * @swagger
 * /api/lead-activity/get/insight:
 *   get:
 *     summary: Get lead activities insights by company
 *     description: Retrieves insights of lead activities for the authenticated company.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights of lead activities for the authenticated company.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalActivities:
 *                   type: integer
 *                   description: The total number of activities
 *                 activityTypeBreakdown:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: Breakdown of activities by type (e.g., calls, meetings)
 *       400:
 *         description: Bad request, unable to fetch insights.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeadActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the lead activity
 *         leadId:
 *           type: string
 *           description: The ID of the lead associated with the activity
 *         activityType:
 *           type: string
 *           description: The type of activity (e.g., "call", "email", "meeting")
 *         description:
 *           type: string
 *           description: A brief description of the activity
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date and time when the activity occurred
 *       required:
 *         - leadId
 *         - activityType
 *         - description
 *         - date
 */

// SWAGGER FOR LEAD ROUTES

/**
 * @swagger
 * tags:
 *   name: Lead Activities
 *   description: API for managing lead activities
 */

/**
 * @swagger
 * /api/lead-activity/:
 *   post:
 *     summary: Create a new lead activity
 *     description: Creates a new activity for a lead.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead for which the activity is created
 *               activityType:
 *                 type: string
 *                 description: The type of activity (e.g., "call", "email", "meeting")
 *               description:
 *                 type: string
 *                 description: A brief description of the activity
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time when the activity occurred
 *     responses:
 *       201:
 *         description: Lead activity created successfully.
 *       400:
 *         description: Bad request, invalid data.
 */

/**
 * @swagger
 * /api/lead-activity/{leadId}:
 *   get:
 *     summary: Get all activities for a specific lead
 *     description: Retrieves all activities associated with a specific lead ID.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead whose activities you want to fetch
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities for the specified lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadActivity'
 *       404:
 *         description: No activities found for the specified lead.
 */

/**
 * @swagger
 * /api/lead-activity/filter/{leadId}:
 *   get:
 *     summary: Get filtered activities for a specific lead
 *     description: Retrieves activities for a lead filtered by specified criteria (e.g., type of activity).
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead whose filtered activities you want to fetch
 *         schema:
 *           type: string
 *       - in: query
 *         name: activityType
 *         description: The type of activity to filter by (e.g., "call", "email", "meeting")
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered list of activities for the specified lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LeadActivity'
 *       404:
 *         description: No activities found matching the filter criteria.
 */

/**
 * @swagger
 * /api/lead-activity/{leadId}:
 *   delete:
 *     summary: Delete all activities for a specific lead
 *     description: Deletes all activities associated with a specific lead ID.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead whose activities you want to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All activities for the lead were deleted successfully.
 *       404:
 *         description: No activities found for the specified lead.
 */

/**
 * @swagger
 * /api/lead-activity/get/insight:
 *   get:
 *     summary: Get lead activities insights by company
 *     description: Retrieves insights of lead activities for the authenticated company.
 *     tags: [Lead Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights of lead activities for the authenticated company.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalActivities:
 *                   type: integer
 *                   description: The total number of activities
 *                 activityTypeBreakdown:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: Breakdown of activities by type (e.g., calls, meetings)
 *       400:
 *         description: Bad request, unable to fetch insights.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LeadActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the lead activity
 *         leadId:
 *           type: string
 *           description: The ID of the lead associated with the activity
 *         activityType:
 *           type: string
 *           description: The type of activity (e.g., "call", "email", "meeting")
 *         description:
 *           type: string
 *           description: A brief description of the activity
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date and time when the activity occurred
 *       required:
 *         - leadId
 *         - activityType
 *         - description
 *         - date
 */

// SWAGGER FOR LEADSROUTES

// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: API for managing leads
 */

// /**
//  * @swagger
//  * /api/leads/:
//  *   get:
//  *     summary: Retrieve all leads
//  *     description: Fetch all leads stored in the MongoDB database.
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved leads.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Lead'
//  */

/**
 * @swagger
 * /api/leads/getcampaign:
 *   get:
 *     summary: Retrieve all campaigns
 *     description: Fetch all campaigns stored in the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved campaigns.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */

/**
 * @swagger
 * /api/leads/getleads/{campaign}:
 *   get:
 *     summary: Get leads data for a specific campaign
 *     description: Get all leads associated with a particular campaign.
 *     parameters:
 *       - in: path
 *         name: campaign
 *         required: true
 *         description: The ID of the campaign to get leads for.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved leads for the campaign.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 */

/**
 * @swagger
 * /api/leads/:
 *   post:
 *     summary: Add a new lead
 *     description: Add a new lead to the database.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     responses:
 *       200:
 *         description: Lead successfully added.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/leads/assign/{campaignid}:
 *   put:
 *     summary: Assign leads to users
 *     description: Assign leads equally to users for a specific campaign.
 *     parameters:
 *       - in: path
 *         name: campaignid
 *         required: true
 *         description: The ID of the campaign to assign leads for.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully assigned leads.
 *       400:
 *         description: Bad request.
 */

/**
 * @swagger
 * /api/leads/updateprofile/{id}:
 *   put:
 *     summary: Update lead profile
 *     description: Update the profile of an existing lead.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the lead to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully updated lead profile.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Lead not found.
 */

/**
 * @swagger
 * /api/leads/{leadId}/status:
 *   put:
 *     summary: Update lead status
 *     description: Update the status of a specific lead.
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: The new status for the lead.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lead status updated.
 *       404:
 *         description: Lead not found.
 */

/**
 * @swagger
 * /api/leads/{leadId}/stages:
 *   put:
 *     summary: Update lead stages
 *     description: Update the stages for a specific lead.
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stage:
 *                 type: string
 *                 description: The new stage for the lead.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lead stages updated.
 *       404:
 *         description: Lead not found.
 */

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Retrieve a specific lead by ID
 *     description: Get the details of a specific lead by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the lead to retrieve.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved lead.
 *       404:
 *         description: Lead not found.
 */

/**
 * @swagger
 * /api/leads/putleads/{id}:
 *   put:
 *     summary: Update specific lead data
 *     description: Update a specific lead using its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the lead to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lead'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully updated lead.
 *       404:
 *         description: Lead not found.
 */

/**
 * @swagger
 * /api/leads/deleteMultiLeads:
 *   delete:
 *     summary: Delete multiple leads
 *     description: Delete multiple leads by their IDs.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The IDs of the leads to delete.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully deleted multiple leads.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/leads/upload:
 *   post:
 *     summary: Upload a document for a lead
 *     description: Upload a file to S3 and associate it with a lead.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               docName:
 *                 type: string
 *                 description: The name of the document.
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead the document is associated with.
 *     responses:
 *       200:
 *         description: File uploaded successfully.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/leads/docs/bylead/{leadId}:
 *   get:
 *     summary: Retrieve all documents for a lead
 *     description: Get all documents uploaded for a specific lead.
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved documents for the lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/File'
 *       404:
 *         description: No documents found for the lead.
 */

/**
 * @swagger
 * /api/leads/leadInsight/{assigneeId}:
 *   get:
 *     summary: Retrieve insights for a lead
 *     description: Get insights for a specific lead assigned to a user.
 *     parameters:
 *       - in: path
 *         name: assigneeId
 *         required: true
 *         description: The ID of the assignee to retrieve lead insights.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved insights for the lead.
 *       404:
 *         description: Lead not found.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Lead:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the lead
 *         name:
 *           type: string
 *           description: The name of the lead
 *         campaign:
 *           type: string
 *           description: The campaign the lead is associated with
 *     File:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the file
 *         docName:
 *           type: string
 *           description: The name of the document
 *         fileName:
 *           type: string
 *           description: The name of the uploaded file
 *         fileUrl:
 *           type: string
 *           description: The URL where the file is stored
 *         fileType:
 *           type: string
 *           description: The type of the file
 */

// SWAGGER FOR NOTESROUTE

// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: API for managing notes
 */

/**
 * @swagger
 * /api/notes/:
 *   post:
 *     summary: Add a new note
 *     description: Add a new note to the database.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the note.
 *               content:
 *                 type: string
 *                 description: The content of the note.
 *     responses:
 *       200:
 *         description: Note successfully added.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/notes/:
 *   get:
 *     summary: Get all notes
 *     description: Retrieve all notes stored in the database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all notes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a specific note
 *     description: Update the details of a specific note by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the note to update.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The updated title of the note.
 *               content:
 *                 type: string
 *                 description: The updated content of the note.
 *     responses:
 *       200:
 *         description: Successfully updated the note.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Note not found.
 */

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a specific note
 *     description: Delete a specific note by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the note to delete.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully deleted the note.
 *       404:
 *         description: Note not found.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the note
 *         title:
 *           type: string
 *           description: The title of the note
 *         content:
 *           type: string
 *           description: The content of the note
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the note was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the note was last updated
 */

//  SWAGGEER FOR PAYMENT ROUTES

// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API for managing payments
 */

/**
 * @swagger
 * /api/payments/:
 *   post:
 *     summary: Create a new payment
 *     description: Add a new payment to the database.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The amount of the payment.
 *               leadId:
 *                 type: string
 *                 description: The ID of the lead associated with the payment.
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time the payment was made.
 *               method:
 *                 type: string
 *                 description: The payment method (e.g., 'Credit Card', 'Bank Transfer').
 *     responses:
 *       200:
 *         description: Payment successfully created.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/payments/:
 *   get:
 *     summary: Get all payments
 *     description: Retrieve all payments stored in the database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all payments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     description: Retrieve a specific payment by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the payment to retrieve.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved the payment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/payments/byLead/{leadId}:
 *   get:
 *     summary: Get payments by lead ID
 *     description: Retrieve all payments associated with a specific lead.
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         description: The ID of the lead to get payments for.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved payments for the lead.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Lead not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   patch:
 *     summary: Update payment details
 *     description: Update the details of a specific payment by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the payment to update.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The updated amount of the payment.
 *               method:
 *                 type: string
 *                 description: The updated payment method.
 *     responses:
 *       200:
 *         description: Payment successfully updated.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Payment not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Delete a payment
 *     description: Delete a specific payment by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the payment to delete.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully deleted the payment.
 *       404:
 *         description: Payment not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the payment.
 *         amount:
 *           type: number
 *           format: float
 *           description: The amount of the payment.
 *         leadId:
 *           type: string
 *           description: The ID of the lead associated with the payment.
 *         paymentDate:
 *           type: string
 *           format: date-time
 *           description: The date and time the payment was made.
 *         method:
 *           type: string
 *           description: The payment method.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the payment record was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the payment record was last updated.
 */

// SWAGGER FOR PIPELINE ROUTES

// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

/**
 * @swagger
 * tags:
 *   name: Pipelines
 *   description: API for managing sales pipelines
 */

/**
 * @swagger
 * /api/pipelines/createpipeline:
 *   post:
 *     summary: Create a new pipeline
 *     description: Add a new pipeline to the database.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the pipeline.
 *               description:
 *                 type: string
 *                 description: A detailed description of the pipeline.
 *               stages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of stages for the pipeline.
 *     responses:
 *       200:
 *         description: Pipeline successfully created.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/pipelines/getpipeline:
 *   get:
 *     summary: Get all pipelines
 *     description: Retrieve all pipelines stored in the database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all pipelines.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pipeline'
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/pipelines/updatepipeline/{pipelineid}:
 *   put:
 *     summary: Update pipeline details
 *     description: Update the details of an existing pipeline.
 *     parameters:
 *       - in: path
 *         name: pipelineid
 *         required: true
 *         description: The ID of the pipeline to update.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the pipeline.
 *               description:
 *                 type: string
 *                 description: A detailed description of the pipeline.
 *               stages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of stages for the pipeline.
 *     responses:
 *       200:
 *         description: Pipeline successfully updated.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Pipeline not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/pipelines/deletepipeline/{pipelineid}:
 *   delete:
 *     summary: Delete a pipeline
 *     description: Delete an existing pipeline by its ID.
 *     parameters:
 *       - in: path
 *         name: pipelineid
 *         required: true
 *         description: The ID of the pipeline to delete.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pipeline successfully deleted.
 *       404:
 *         description: Pipeline not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Pipeline:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the pipeline.
 *         name:
 *           type: string
 *           description: The name of the pipeline.
 *         description:
 *           type: string
 *           description: A detailed description of the pipeline.
 *         stages:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of stages for the pipeline.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the pipeline was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the pipeline was last updated.
 */

// SWAGGER FOR SALESROUTE

// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: API for managing sales
 */

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales by company
 *     description: Retrieve all sales data associated with a specific company.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved sales data.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sale'
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the sale.
 *         amount:
 *           type: number
 *           format: float
 *           description: The amount of the sale.
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date and time the sale occurred.
 *         customer:
 *           type: string
 *           description: The name of the customer.
 *         salesRep:
 *           type: string
 *           description: The name of the sales representative responsible for the sale.
 *         company:
 *           type: string
 *           description: The company associated with the sale.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the sale was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the sale was last updated.
 */

// SWAGGER FOR ROUTES

// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: API for managing tasks
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Create a new task for a specific lead or user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request - Invalid task data.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve all tasks for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all tasks.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update an existing task
 *     description: Update details of an existing task by task ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the task to be updated.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request - Invalid task data.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Delete a specific task by task ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the task to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the task.
 *         title:
 *           type: string
 *           description: The title of the task.
 *         description:
 *           type: string
 *           description: A detailed description of the task.
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: The due date of the task.
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *           description: The current status of the task.
 *         assignedTo:
 *           type: string
 *           description: The ID of the user assigned to the task.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the task was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the task was last updated.
 */

// SWAGGER FOR TICKET ROUTES

// /**
//  * @swagger
//  * components:
//  *   securitySchemes:
//  *     bearerAuth:
//  *       type: http
//  *       scheme: bearer
//  *       bearerFormat: JWT
//  */

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: API for managing tickets
 */

/**
 * @swagger
 * /api/tickets/create:
 *   post:
 *     summary: Create a new ticket
 *     description: Create a new ticket with optional attachments.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the ticket.
 *               description:
 *                 type: string
 *                 description: Detailed description of the ticket.
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The attachments for the ticket.
 *     responses:
 *       200:
 *         description: Ticket created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Bad request - Invalid ticket data.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/gettickets:
 *   get:
 *     summary: Retrieve all tickets
 *     description: Get a list of all tickets.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all tickets.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/gettickets/{ticketId}:
 *   get:
 *     summary: Retrieve a specific ticket by ID
 *     description: Fetch a ticket by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         description: The ID of the ticket to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the ticket.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/tickets/{ticketId}/attachments/{attachmentId}:
 *   get:
 *     summary: Get an attachment file URL by ticket and attachment ID
 *     description: Fetch an attachment for a specific ticket.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         description: The ID of the ticket.
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         description: The ID of the attachment.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved attachment URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: The URL of the attachment file.
 *       404:
 *         description: Attachment not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/tickets/{ticketId}/status:
 *   put:
 *     summary: Update the status of a ticket
 *     description: Update the status of a specific ticket by ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         description: The ID of the ticket to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: The new status of the ticket.
 *                 enum: [open, closed, pending]
 *     responses:
 *       200:
 *         description: Successfully updated ticket status.
 *       400:
 *         description: Bad request - Invalid ticket data.
 *       404:
 *         description: Ticket not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/createnotes:
 *   post:
 *     summary: Create a note for a ticket
 *     description: Add a note to a specific ticket.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketId:
 *                 type: string
 *                 description: The ID of the ticket.
 *               note:
 *                 type: string
 *                 description: The content of the note.
 *     responses:
 *       200:
 *         description: Note created successfully.
 *       400:
 *         description: Bad request - Invalid note data.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/getnotes/{ticketId}:
 *   get:
 *     summary: Retrieve all notes for a ticket
 *     description: Get all notes related to a specific ticket.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         description: The ID of the ticket.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved all notes for the ticket.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   note:
 *                     type: string
 *                     description: The content of the note.
 *       404:
 *         description: Ticket not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/updatenotes/{noteId}:
 *   put:
 *     summary: Update a note for a ticket
 *     description: Update a specific note by note ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         description: The ID of the note to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: The updated content of the note.
 *     responses:
 *       200:
 *         description: Note updated successfully.
 *       400:
 *         description: Bad request - Invalid note data.
 *       404:
 *         description: Note not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/deletenotes/{noteId}:
 *   delete:
 *     summary: Delete a note from a ticket
 *     description: Delete a specific note by note ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         description: The ID of the note to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note deleted successfully.
 *       404:
 *         description: Note not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /api/tickets/updatehistory:
 *   put:
 *     summary: Update the history status of a ticket
 *     description: Update the history status of a ticket.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               historyStatus:
 *                 type: string
 *                 description: The new history status.
 *     responses:
 *       200:
 *         description: History status updated successfully.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the ticket.
 *         title:
 *           type: string
 *           description: The title of the ticket.
 *         description:
 *           type: string
 *           description: Detailed description of the ticket.
 *         status:
 *           type: string
 *           description: The status of the ticket (open, closed, pending).
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the ticket was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the ticket was last updated.
 *     Note:
 *       type: object
 *       properties:
 *         note:
 *           type: string
 *           description: The content of the note.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the note was created.
 *     Attachment:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: The URL of the attachment.
 */

// SWAGGER FOR USERPROFILE ROUTES

/**
 * @swagger
 * tags:
 *   name: User Profiles
 *   description: API for managing user profiles
 */

/**
 * @swagger
 * /api/user-profiles/:
 *   get:
 *     summary: Get user profiles
 *     description: Retrieve user profiles from the MongoDB database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched user profiles from MongoDB.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique identifier of the user.
 *                   name:
 *                     type: string
 *                     description: The name of the user.
 *                   email:
 *                     type: string
 *                     description: The email address of the user.
 */
/**
 * @swagger
 * /api/user-profiles/:
 *   post:
 *     summary: create user profile
 *     description: This API is used to add a new user to MongoDB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: user added successfully.
 */