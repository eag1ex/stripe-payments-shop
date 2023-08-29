_____
>_The **Payments Integration Challenge** is modeled after a consulting engagement with a make-believe client who gives you requirements for a Stripe integration.  Follow these steps to get started:_
> 1. _Start by reading this README, taking a look at the open pull request for the first milestone, and checking out the `dev` branch._
> 2. _Search for the `TODO` comments related to the milestone, implement the requirements listed in the pull request, and then push back up._
> 3. _Look at the comment on the pull request for feedback, then start iterating._
>
> _If you need assistance, reach out to partner-support@stripe.com._
___

<details> 
  <summary>You receive an email from alex@ipsumstreetmusic.com with subject: "Stripe Integration Project?" </summary>
  
  <br />
  
  Hello!  
  
  I'm the owner of the Ipsum Street Music Shop.  My small team and I need a developer to add a Stripe integration to our website so I can start accepting payments online.  If you can help us, please see the attached project brief for more info about our implementation needs.
  
  Thank you,
  
  Alex

</details>

# Brief: Payments for Music Shop

Ipsum Street Music Shop offers a variety of products and services, but our most reliable seller is music lessons.

We used to be offline and cash-only, but that became impossible during the pandemic; we decided to temporarily shut down.  The team worked on side projects for a while, but now we're all ready to get back in business.

## Project context

We previously hired a contract developer to build our website; as a small business, we don't have the time or expertise to worry about how to safely store payment details.  We're focusing on rebuilding our previous business for now, but are thinking about expanding.  We dream of someday building a marketplace to help all independent musicians make extra money through teaching, but first things first.

After comparing a few payment providers and discussing with the developer, we chose Stripe because:

- They have a reputation for security and reliability.
- Our developer said their products are flexible and easy to work with.
- They offer a wide variety of financial services for us to grow into.

Stripe can help us eventually give all musicians an independent income, bank accounts, capital loans, and more.  For now, though, we just need to start accepting payments online.

## Deliverables

Unfortunately, the contract developer who built our site had to change projects and wasn't able to implement the Stripe integration.  They had four key milestones remaining:

1. **Signing up:** Allow students to put down a card and set up their account so they can reserve an online lesson.
2. **Paying for lessons:** Allow our instructors to separately authorize and capture the payment, so they can reserve funds and then finalize the amount charged after the lesson is complete.
3. **Managing account info:** Allow students to update the name, email, or card details associated with their account.
4. **Accounting reports:** Generate custom reports for our accountant, such as the list of students with failed payments.

The website also includes pages for selling concert tickets and tutorial videos, but you don't need to worry about those.  For now, we're focused on lessons.

## Collaboration process

We've already started a branch for you to checkout and get started on the first milestone, along with a pull request that includes more detailed information about the requirements.  Complete the Stripe implementation, push your commit to the branch, and our test suite will leave a comment with feedback.  You can also run tests locally to accelerate your iteration loop.  After you satisfy all the requirements, we'll automatically merge and open a new pull request for the next milestone.

_This automation depends on GitHub Actions.  If the tests aren't immediately running, try checking their [status page](https://www.githubstatus.com/) to see if there is an incident._

## Completing the application 

Our previous developer left notes in `code/README.md` about how to run the site.  They couldn't finish the Stripe integration before they had to change projects, but they followed test-driven development practices and built thorough integration tests of the server and user interface.  

For these tests to keep being useful, your work cannot change:
1. Any of the server's existing routes.
2. Any of the classes and IDs from the rendered web page.

If you change any of these, the integration tests fail and you can't proceed with the project.  

Please try to only make the changes necessary to satisfy the requirements.  We're only concerned about how the site runs on the latest version of Google Chrome.  

## Working with Stripe

Please use Stripe API version of 2022-11-15 or latest for this challenge. (See your default API Version - https://stripe.com/docs/development/dashboard/request-logs#view-your-default-api-version)

We would prefer not to share credentials from our Stripe account, use a personal account for test mode development.  Your integration needs to be "portable", ready to run on a new Stripe account if the API keys change in `code/server/.env`.  This includes both the server-side keys and the client-side keys.  

If any of your API keys are written directly into files, or drawn from anywhere other than `code/server/.env`, we won't be able to check your work and you can't proceed through the challenge.  If the project works on your machine but not in tests, try putting keys from a different Stripe account into that `code/server/.env` file and see if it keeps working.

 * _We simulate a real business context by running your challenge integration against an account with a large history; hundreds of payments per week, tens of thousands of customers.  Make sure your solution can be ran efficiently against a large set of resources._
 * _As always, you should **never** commit API secrets into source control. Make sure your Stripe account is (1) up to date with the latest API version, and (2) isn't operating an active business.  If necessary, you can easily [create new Stripe accounts](https://stripe.com/docs/multiple-accounts).  You don't need to activate the account, your integration only runs in test mode._

 
