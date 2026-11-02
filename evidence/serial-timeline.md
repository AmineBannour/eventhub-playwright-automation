# Parallel execution evidence

Source: `reports/results.json` · generated 2026-11-01T19:18:22.739Z

- Tests executed: **47** (47 passed)
- Workers used: **1** (parallel indexes 0)
- Peak tests running at the same time: **1**
- Wall-clock time: **35.0 s** vs. sum of test durations **32.8 s**

## Timeline (each bar = one test, rows grouped by worker)

```text
worker 0
  |█                                                           | API-02 tokens are issued only for valid credentials and protected endp
  |█                                                           | API-01 GET /api/health and /api/ticket-types return the documented con
  |██                                                          | API-03 POST /api/registrations creates a registration (201, Location, 
  | █                                                          | API-04 GET returns a registration by id, filters the list by email, an
  | ███                                                        | API-05 PUT updates a registration and the change is persisted @crud @p
  |   ██                                                       | API-06 DELETE removes a registration; repeated delete and later reads 
  |    █                                                       | API-07 [boundary age=17] -> 400 @boundary @data-driven
  |    ███                                                     | API-07 [boundary age=18] -> 201 @boundary @data-driven
  |      ██                                                    | API-07 [boundary age=99] -> 201 @boundary @data-driven
  |       █                                                    | API-07 [boundary age=100] -> 400 @boundary @data-driven
  |       █                                                    | API-07 [boundary tickets=0] -> 400 @boundary @data-driven
  |       ███                                                  | API-07 [boundary tickets=1] -> 201 @boundary @data-driven
  |         ██                                                 | API-07 [boundary tickets=10] -> 201 @boundary @data-driven
  |          █                                                 | API-07 [boundary tickets=11] -> 400 @boundary @data-driven
  |          █                                                 | API-07 [malformed email] -> 400 with a field error @negative @validati
  |          █                                                 | API-07 [date in the past] -> 400 with a field error @negative @validat
  |          █                                                 | API-07 [date is today] -> 400 with a field error @negative @validation
  |          █                                                 | API-07 [date on a Sunday] -> 400 with a field error @negative @validat
  |          █                                                 | API-07 [wrong date format] -> 400 with a field error @negative @valida
  |          █                                                 | API-07 [unknown ticket type] -> 400 with a field error @negative @vali
  |          █                                                 | API-07 [notes over 500 characters] -> 400 with a field error @negative
  |          █                                                 | API-07 [document is not a PDF] -> 400 with a field error @negative @va
  |          █████                                             | API-08 duplicate email, empty body and malformed JSON return clear err
  |                ██                                          | UI-10 sign-in guards the registration page and lands users on it after
  |                  ██                                        | UI-07 event date only allows Monday-Saturday dates from tomorrow to on
  |                   ████                                     | UI-09 cancelling the modal and the delete confirmation keeps data; acc
  |                      ████                                  | UI-F01 a second registration with an already-used email is rejected wi
  |                         ██████                             | UI-08 total price, character counter and list filter update as the use
  |                              ██                            | UI-02 submitting an empty form shows every required-field message and 
  |                               ██                           | UI-03 [DD-01] rejects fullName="A" with the right message @data-driven
  |                                ██                          | UI-03 [DD-02] rejects fullName="R2-D2" with the right message @data-dr
  |                                 ██                         | UI-03 [DD-03] rejects email="ada.lovelace.example.com" with the right 
  |                                  ██                        | UI-03 [DD-04] rejects email="ada@example" with the right message @data
  |                                   ██                       | UI-03 [DD-05] rejects age="25.5" with the right message @data-driven @
  |                                    ██                      | UI-03 [DD-06] rejects tickets="-3" with the right message @data-driven
  |                                     █                      | UI-03 [DD-07] rejects age="" with the right message @data-driven @vali
  |                                     ██                     | UI-04 [age=17] is rejected at the boundary @boundary @data-driven
  |                                      ██                    | UI-04 [age=18] is accepted at the boundary @boundary @data-driven
  |                                       ██                   | UI-04 [age=99] is accepted at the boundary @boundary @data-driven
  |                                        ██                  | UI-04 [age=100] is rejected at the boundary @boundary @data-driven
  |                                         ██                 | UI-04 [tickets=0] is rejected at the boundary @boundary @data-driven
  |                                          ██                | UI-04 [tickets=1] is accepted at the boundary @boundary @data-driven
  |                                           ██               | UI-04 [tickets=10] is accepted at the boundary @boundary @data-driven
  |                                            ██              | UI-04 [tickets=11] is rejected at the boundary @boundary @data-driven
  |                                             ████████████   | UI-01 registers with valid data and the registration is displayed and 
  |                                                        ███ | UI-05 ID document upload accepts PDFs up to 1 MB and rejects other fil
  |                                                          ██| UI-06 profile photo accepts real PNG/JPEG images and rejects invalid o
```

## Detail

| Worker | Start (+s) | Duration (s) | Project | Status | Test |
|---|---|---|---|---|---|
| 0 | 0.00 | 0.11 | api | passed | API-02 tokens are issued only for valid credentials and protected endpoints require one @auth @negative @schema |
| 0 | 0.14 | 0.03 | api | passed | API-01 GET /api/health and /api/ticket-types return the documented contract and headers @smoke @schema @headers |
| 0 | 0.18 | 0.46 | api | passed | API-03 POST /api/registrations creates a registration (201, Location, schema, computed total) @crud @schema @positive |
| 0 | 0.65 | 0.49 | api | passed | API-04 GET returns a registration by id, filters the list by email, and 404s for unknown ids @crud @negative |
| 0 | 1.15 | 0.77 | api | passed | API-05 PUT updates a registration and the change is persisted @crud @positive |
| 0 | 1.94 | 0.84 | api | passed | API-06 DELETE removes a registration; repeated delete and later reads return 404 @crud @negative |
| 0 | 2.79 | 0.02 | api | passed | API-07 [boundary age=17] -> 400 @boundary @data-driven |
| 0 | 2.82 | 0.82 | api | passed | API-07 [boundary age=18] -> 201 @boundary @data-driven |
| 0 | 3.65 | 0.55 | api | passed | API-07 [boundary age=99] -> 201 @boundary @data-driven |
| 0 | 4.22 | 0.02 | api | passed | API-07 [boundary age=100] -> 400 @boundary @data-driven |
| 0 | 4.24 | 0.02 | api | passed | API-07 [boundary tickets=0] -> 400 @boundary @data-driven |
| 0 | 4.28 | 1.16 | api | passed | API-07 [boundary tickets=1] -> 201 @boundary @data-driven |
| 0 | 5.45 | 0.46 | api | passed | API-07 [boundary tickets=10] -> 201 @boundary @data-driven |
| 0 | 5.92 | 0.02 | api | passed | API-07 [boundary tickets=11] -> 400 @boundary @data-driven |
| 0 | 5.95 | 0.02 | api | passed | API-07 [malformed email] -> 400 with a field error @negative @validation @data-driven |
| 0 | 5.99 | 0.02 | api | passed | API-07 [date in the past] -> 400 with a field error @negative @validation @data-driven |
| 0 | 6.03 | 0.02 | api | passed | API-07 [date is today] -> 400 with a field error @negative @validation @data-driven |
| 0 | 6.06 | 0.03 | api | passed | API-07 [date on a Sunday] -> 400 with a field error @negative @validation @data-driven |
| 0 | 6.10 | 0.02 | api | passed | API-07 [wrong date format] -> 400 with a field error @negative @validation @data-driven |
| 0 | 6.13 | 0.02 | api | passed | API-07 [unknown ticket type] -> 400 with a field error @negative @validation @data-driven |
| 0 | 6.17 | 0.02 | api | passed | API-07 [notes over 500 characters] -> 400 with a field error @negative @validation @data-driven |
| 0 | 6.20 | 0.02 | api | passed | API-07 [document is not a PDF] -> 400 with a field error @negative @validation @data-driven |
| 0 | 6.24 | 2.20 | api | passed | API-08 duplicate email, empty body and malformed JSON return clear errors @negative @error-handling |
| 0 | 9.70 | 0.74 | ui | passed | UI-10 sign-in guards the registration page and lands users on it after login @regression @smoke @negative |
| 0 | 10.76 | 0.72 | ui | passed | UI-07 event date only allows Monday-Saturday dates from tomorrow to one year ahead @date @validation @boundary |
| 0 | 11.48 | 1.67 | ui | passed | UI-09 cancelling the modal and the delete confirmation keeps data; accepting deletes it @dialog @state |
| 0 | 13.18 | 1.95 | ui | passed | UI-F01 a second registration with an already-used email is rejected with a clear error @negative @failure |
| 0 | 15.15 | 2.55 | ui | passed | UI-08 total price, character counter and list filter update as the user interacts @dynamic |
| 0 | 17.73 | 0.61 | ui | passed | UI-02 submitting an empty form shows every required-field message and opens no dialog @negative @validation |
| 0 | 18.36 | 0.52 | ui | passed | UI-03 [DD-01] rejects fullName="A" with the right message @data-driven @validation @negative |
| 0 | 18.90 | 0.53 | ui | passed | UI-03 [DD-02] rejects fullName="R2-D2" with the right message @data-driven @validation @negative |
| 0 | 19.44 | 0.51 | ui | passed | UI-03 [DD-03] rejects email="ada.lovelace.example.com" with the right message @data-driven @validation @negative |
| 0 | 19.97 | 0.52 | ui | passed | UI-03 [DD-04] rejects email="ada@example" with the right message @data-driven @validation @negative |
| 0 | 20.50 | 0.54 | ui | passed | UI-03 [DD-05] rejects age="25.5" with the right message @data-driven @validation @negative |
| 0 | 21.06 | 0.53 | ui | passed | UI-03 [DD-06] rejects tickets="-3" with the right message @data-driven @validation @negative |
| 0 | 21.60 | 0.49 | ui | passed | UI-03 [DD-07] rejects age="" with the right message @data-driven @validation @negative |
| 0 | 22.11 | 0.54 | ui | passed | UI-04 [age=17] is rejected at the boundary @boundary @data-driven |
| 0 | 22.67 | 0.53 | ui | passed | UI-04 [age=18] is accepted at the boundary @boundary @data-driven |
| 0 | 23.21 | 0.55 | ui | passed | UI-04 [age=99] is accepted at the boundary @boundary @data-driven |
| 0 | 23.78 | 0.52 | ui | passed | UI-04 [age=100] is rejected at the boundary @boundary @data-driven |
| 0 | 24.32 | 0.53 | ui | passed | UI-04 [tickets=0] is rejected at the boundary @boundary @data-driven |
| 0 | 24.86 | 0.51 | ui | passed | UI-04 [tickets=1] is accepted at the boundary @boundary @data-driven |
| 0 | 25.38 | 0.52 | ui | passed | UI-04 [tickets=10] is accepted at the boundary @boundary @data-driven |
| 0 | 25.91 | 0.53 | ui | passed | UI-04 [tickets=11] is rejected at the boundary @boundary @data-driven |
| 0 | 26.47 | 6.56 | ui | passed | UI-01 registers with valid data and the registration is displayed and persisted @positive @state @regression |
| 0 | 33.04 | 0.91 | ui | passed | UI-05 ID document upload accepts PDFs up to 1 MB and rejects other files @file @validation |
| 0 | 33.97 | 1.02 | ui | passed | UI-06 profile photo accepts real PNG/JPEG images and rejects invalid ones @file @validation |
