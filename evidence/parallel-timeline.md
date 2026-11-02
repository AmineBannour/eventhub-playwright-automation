# Parallel execution evidence

Source: `reports/results.json` · generated 2026-11-01T19:18:44.056Z

- Tests executed: **47** (47 passed)
- Workers used: **4** (parallel indexes 0, 1, 2, 3)
- Peak tests running at the same time: **4**
- Wall-clock time: **14.2 s** vs. sum of test durations **32.3 s**

## Timeline (each bar = one test, rows grouped by worker)

```text
worker 0
  |█                                                           | API-02 tokens are issued only for valid credentials and protected endp
  |█████                                                       | API-06 DELETE removes a registration; repeated delete and later reads 
  |    █                                                       | API-07 [boundary age=100] -> 400 @boundary @data-driven
  |    █                                                       | API-07 [boundary tickets=0] -> 400 @boundary @data-driven
  |     ███                                                    | API-07 [boundary tickets=1] -> 201 @boundary @data-driven
  |           ████                                             | UI-07 event date only allows Monday-Saturday dates from tomorrow to on
  |               ███                                          | UI-02 submitting an empty form shows every required-field message and 
  |                 ██                                         | UI-03 [DD-01] rejects fullName="A" with the right message @data-driven
  |                  ██                                        | UI-03 [DD-02] rejects fullName="R2-D2" with the right message @data-dr
  |                   ███                                      | UI-03 [DD-03] rejects email="ada.lovelace.example.com" with the right 
  |                     ██                                     | UI-03 [DD-04] rejects email="ada@example" with the right message @data
  |                      ██                                    | UI-03 [DD-05] rejects age="25.5" with the right message @data-driven @
  |                        ██                                  | UI-03 [DD-07] rejects age="" with the right message @data-driven @vali
  |                          ███                               | UI-04 [age=99] is accepted at the boundary @boundary @data-driven
  |                            ███                             | UI-04 [tickets=1] is accepted at the boundary @boundary @data-driven
  |                              ██████████████████████████████| UI-01 registers with valid data and the registration is displayed and 
worker 1
  |█                                                           | API-01 GET /api/health and /api/ticket-types return the documented con
  |██████                                                      | API-05 PUT updates a registration and the change is persisted @crud @p
  |     ██                                                     | API-07 [date on a Sunday] -> 400 with a field error @negative @validat
  |      █                                                     | API-07 [unknown ticket type] -> 400 with a field error @negative @vali
  |      █                                                     | API-07 [document is not a PDF] -> 400 with a field error @negative @va
  |          ████                                              | UI-10 sign-in guards the registration page and lands users on it after
  |              ███████████                                   | UI-08 total price, character counter and list filter update as the use
  |                        ███                                 | UI-04 [age=17] is rejected at the boundary @boundary @data-driven
  |                          ████                              | UI-04 [tickets=0] is rejected at the boundary @boundary @data-driven
  |                             ███                            | UI-04 [tickets=11] is rejected at the boundary @boundary @data-driven
worker 2
  |████                                                        | API-03 POST /api/registrations creates a registration (201, Location, 
  |   ███                                                      | API-07 [boundary age=99] -> 201 @boundary @data-driven
  |     █                                                      | API-07 [boundary tickets=11] -> 400 @boundary @data-driven
  |     █                                                      | API-07 [malformed email] -> 400 with a field error @negative @validati
  |     █                                                      | API-07 [date in the past] -> 400 with a field error @negative @validat
  |     █                                                      | API-07 [date is today] -> 400 with a field error @negative @validation
  |     ██                                                     | API-07 [wrong date format] -> 400 with a field error @negative @valida
  |      █                                                     | API-07 [notes over 500 characters] -> 400 with a field error @negative
  |      ████████                                              | API-08 duplicate email, empty body and malformed JSON return clear err
  |                  █████████████                             | UI-F01 a second registration with an already-used email is rejected wi
  |                               █████                        | UI-06 profile photo accepts real PNG/JPEG images and rejects invalid o
worker 3
  |███                                                         | API-04 GET returns a registration by id, filters the list by email, an
  |  █                                                         | API-07 [boundary age=17] -> 400 @boundary @data-driven
  |  ████                                                      | API-07 [boundary age=18] -> 201 @boundary @data-driven
  |     █████                                                  | API-07 [boundary tickets=10] -> 201 @boundary @data-driven
  |             █████████                                      | UI-09 cancelling the modal and the delete confirmation keeps data; acc
  |                       ██                                   | UI-03 [DD-06] rejects tickets="-3" with the right message @data-driven
  |                        ███                                 | UI-04 [age=18] is accepted at the boundary @boundary @data-driven
  |                          ███                               | UI-04 [age=100] is rejected at the boundary @boundary @data-driven
  |                            ███                             | UI-04 [tickets=10] is accepted at the boundary @boundary @data-driven
  |                               ████                         | UI-05 ID document upload accepts PDFs up to 1 MB and rejects other fil
```

## Detail

| Worker | Start (+s) | Duration (s) | Project | Status | Test |
|---|---|---|---|---|---|
| 3 | 0.00 | 0.55 | api | passed | API-04 GET returns a registration by id, filters the list by email, and 404s for unknown ids @crud @negative |
| 1 | 0.02 | 0.07 | api | passed | API-01 GET /api/health and /api/ticket-types return the documented contract and headers @smoke @schema @headers |
| 0 | 0.03 | 0.10 | api | passed | API-02 tokens are issued only for valid credentials and protected endpoints require one @auth @negative @schema |
| 2 | 0.04 | 0.68 | api | passed | API-03 POST /api/registrations creates a registration (201, Location, schema, computed total) @crud @schema @positive |
| 1 | 0.12 | 1.25 | api | passed | API-05 PUT updates a registration and the change is persisted @crud @positive |
| 0 | 0.15 | 0.95 | api | passed | API-06 DELETE removes a registration; repeated delete and later reads return 404 @crud @negative |
| 3 | 0.58 | 0.02 | api | passed | API-07 [boundary age=17] -> 400 @boundary @data-driven |
| 3 | 0.60 | 0.60 | api | passed | API-07 [boundary age=18] -> 201 @boundary @data-driven |
| 2 | 0.74 | 0.51 | api | passed | API-07 [boundary age=99] -> 201 @boundary @data-driven |
| 0 | 1.12 | 0.02 | api | passed | API-07 [boundary age=100] -> 400 @boundary @data-driven |
| 0 | 1.16 | 0.02 | api | passed | API-07 [boundary tickets=0] -> 400 @boundary @data-driven |
| 0 | 1.19 | 0.52 | api | passed | API-07 [boundary tickets=1] -> 201 @boundary @data-driven |
| 3 | 1.22 | 0.91 | api | passed | API-07 [boundary tickets=10] -> 201 @boundary @data-driven |
| 2 | 1.27 | 0.02 | api | passed | API-07 [boundary tickets=11] -> 400 @boundary @data-driven |
| 2 | 1.30 | 0.02 | api | passed | API-07 [malformed email] -> 400 with a field error @negative @validation @data-driven |
| 2 | 1.34 | 0.02 | api | passed | API-07 [date in the past] -> 400 with a field error @negative @validation @data-driven |
| 2 | 1.38 | 0.02 | api | passed | API-07 [date is today] -> 400 with a field error @negative @validation @data-driven |
| 1 | 1.39 | 0.03 | api | passed | API-07 [date on a Sunday] -> 400 with a field error @negative @validation @data-driven |
| 2 | 1.41 | 0.02 | api | passed | API-07 [wrong date format] -> 400 with a field error @negative @validation @data-driven |
| 1 | 1.43 | 0.01 | api | passed | API-07 [unknown ticket type] -> 400 with a field error @negative @validation @data-driven |
| 2 | 1.44 | 0.01 | api | passed | API-07 [notes over 500 characters] -> 400 with a field error @negative @validation @data-driven |
| 1 | 1.46 | 0.01 | api | passed | API-07 [document is not a PDF] -> 400 with a field error @negative @validation @data-driven |
| 2 | 1.46 | 1.83 | api | passed | API-08 duplicate email, empty body and malformed JSON return clear errors @negative @error-handling |
| 1 | 2.43 | 0.69 | ui | passed | UI-10 sign-in guards the registration page and lands users on it after login @regression @smoke @negative |
| 0 | 2.66 | 0.71 | ui | passed | UI-07 event date only allows Monday-Saturday dates from tomorrow to one year ahead @date @validation @boundary |
| 3 | 3.25 | 1.92 | ui | passed | UI-09 cancelling the modal and the delete confirmation keeps data; accepting deletes it @dialog @state |
| 1 | 3.38 | 2.35 | ui | passed | UI-08 total price, character counter and list filter update as the user interacts @dynamic |
| 0 | 3.64 | 0.39 | ui | passed | UI-02 submitting an empty form shows every required-field message and opens no dialog @negative @validation |
| 0 | 4.04 | 0.32 | ui | passed | UI-03 [DD-01] rejects fullName="A" with the right message @data-driven @validation @negative |
| 0 | 4.36 | 0.29 | ui | passed | UI-03 [DD-02] rejects fullName="R2-D2" with the right message @data-driven @validation @negative |
| 2 | 4.46 | 2.65 | ui | passed | UI-F01 a second registration with an already-used email is rejected with a clear error @negative @failure |
| 0 | 4.66 | 0.32 | ui | passed | UI-03 [DD-03] rejects email="ada.lovelace.example.com" with the right message @data-driven @validation @negative |
| 0 | 5.00 | 0.32 | ui | passed | UI-03 [DD-04] rejects email="ada@example" with the right message @data-driven @validation @negative |
| 0 | 5.34 | 0.33 | ui | passed | UI-03 [DD-05] rejects age="25.5" with the right message @data-driven @validation @negative |
| 3 | 5.45 | 0.37 | ui | passed | UI-03 [DD-06] rejects tickets="-3" with the right message @data-driven @validation @negative |
| 0 | 5.68 | 0.45 | ui | passed | UI-03 [DD-07] rejects age="" with the right message @data-driven @validation @negative |
| 1 | 5.75 | 0.53 | ui | passed | UI-04 [age=17] is rejected at the boundary @boundary @data-driven |
| 3 | 5.84 | 0.40 | ui | passed | UI-04 [age=18] is accepted at the boundary @boundary @data-driven |
| 0 | 6.15 | 0.55 | ui | passed | UI-04 [age=99] is accepted at the boundary @boundary @data-driven |
| 3 | 6.25 | 0.55 | ui | passed | UI-04 [age=100] is rejected at the boundary @boundary @data-driven |
| 1 | 6.29 | 0.60 | ui | passed | UI-04 [tickets=0] is rejected at the boundary @boundary @data-driven |
| 0 | 6.72 | 0.55 | ui | passed | UI-04 [tickets=1] is accepted at the boundary @boundary @data-driven |
| 3 | 6.81 | 0.51 | ui | passed | UI-04 [tickets=10] is accepted at the boundary @boundary @data-driven |
| 1 | 6.91 | 0.55 | ui | passed | UI-04 [tickets=11] is rejected at the boundary @boundary @data-driven |
| 0 | 7.30 | 6.88 | ui | passed | UI-01 registers with valid data and the registration is displayed and persisted @positive @state @regression |
| 3 | 7.35 | 0.90 | ui | passed | UI-05 ID document upload accepts PDFs up to 1 MB and rejects other files @file @validation |
| 2 | 7.38 | 0.98 | ui | passed | UI-06 profile photo accepts real PNG/JPEG images and rejects invalid ones @file @validation |
