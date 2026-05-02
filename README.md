---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: e23-co2060-stress-detection-and-analyzing-system
title: Stress Detection and Analyzing System
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template, and add more information required for your own project"

<!-- Once you fill the index.json file inside /docs/data, please make sure the syntax is correct. (You can use this tool to identify syntax errors)

Please include the "correct" email address of your supervisors. (You can find them from https://people.ce.pdn.ac.lk/ )

Please include an appropriate cover page image ( cover_page.jpg ) and a thumbnail image ( thumbnail.jpg ) in the same folder as the index.json (i.e., /docs/data ). The cover page image must be cropped to 940×352 and the thumbnail image must be cropped to 640×360 . Use https://croppola.com/ for cropping and https://squoosh.app/ to reduce the file size.

If your followed all the given instructions correctly, your repository will be automatically added to the department's project web site (Update daily)

A HTML template integrated with the given GitHub repository templates, based on github.com/cepdnaclk/eYY-project-theme . If you like to remove this default theme and make your own web page, you can remove the file, docs/_config.yml and create the site using HTML. -->

# Project Title

---

## Team
-  E/23/108, W.G.R.P. Gamage, [e23108@eng.pdn.ac.lk](mailto:e23108@eng.pdn.ac.lk)
-  E/23/117, W.R.A.D.N. Gunathilake, [e23117@eng.pdn.ac.lk](mailto:e23117@eng.pdn.ac.lk)
-  E/23/127, H.M.K.I. Herath, [e23127@eng.pdn.ac.lk](mailto:e23127@eng.pdn.ac.lk)
-  E/23/188,  K.M.M.Y. Kumarasinghe, [e23188@eng.pdn.ac.lk](mailto:e23188@eng.pdn.ac.lk)

<!-- Image (photo/drawing of the final hardware) should be here -->

<!-- This is a sample image, to show how to add images to your page. To learn more options, please refer [this](https://projects.ce.pdn.ac.lk/docs/faq/how-to-add-an-image/) -->

<!-- ![Sample Image](./images/sample.png) -->

#### Table of Contents
1. [Introduction](#introduction)
2. [Solution Architecture](#solution-architecture )
3. [Software Designs](#hardware-and-software-designs)
4. [Testing](#testing)
5. [Conclusion](#conclusion)
6. [Links](#links)

## Introduction

This project addresses a real-world problem by translating practical challenges into a scalable software solution. The goal is to bridge the gap between user needs and system capabilities through a well-structured, technology-driven approach.

The solution is designed with a strong emphasis on reliability, usability, and extensibility, ensuring measurable impact in terms of efficiency, accuracy, and overall user experience. This project demonstrates how sound engineering principles can be applied to deliver real value in a practical context.

## Solution Architecture

The system follows a modular, layered architecture to ensure scalability, maintainability, and clear separation of concerns.

At a high level, the architecture consists of:

Frontend: Responsible for user interaction and presentation logic.

Backend: Handles core business logic, request processing, and system orchestration.

Database: Manages persistent data storage and retrieval.

This architecture enables smooth communication between components, improves fault isolation, and supports future expansion with minimal architectural changes.

## Software Designs

The software design is broken down into multiple detailed sub-sections to clearly explain how the system operates internally.

Key design aspects include:

Component-level decomposition

Data flow and interaction patterns

Interface definitions between modules

Design decisions and trade-offs

This structured design approach ensures the system remains robust, easy to understand, and adaptable to evolving requirements.

## Testing

Testing was carried out manually across the main user flows in both the mobile app and the backend-supported pages. The team verified that users can register, log in, complete the questionnaire, receive a stress result, and move to the next suggested action without breaking the flow.

The following features were checked during testing:

- User registration and login with valid and invalid credentials
- Questionnaire submission and result generation
- Routine generation from daily task input
- Saving and viewing generated routines
- Clinic locator results for nearby clinics
- Persistence of user data for later access

Acceptance testing was also used to confirm that the app behaves correctly in realistic usage scenarios, including repeated logins, revisiting saved data, and switching between mobile screens.

## Conclusion

This project delivers a complete stress management system that combines questionnaire-based assessment, AI-assisted routine generation, clinic location support, and saved user data in one workflow. The application is designed to help users understand their stress-related state and take practical next steps with minimal effort.

The current implementation provides a solid base for future improvements such as richer stress trend analytics, notification reminders, better report export, and additional personalization in the generated routines. With these extensions, the system can evolve into a more complete stress monitoring and support platform.

## Links

- [Project Repository](https://github.com/cepdnaclk/e23-co2060-stress-detection-and-analyzing-system)
- [Project Page](https://cepdnaclk.github.io/e23-co2060-stress-detection-and-analyzing-system/){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
