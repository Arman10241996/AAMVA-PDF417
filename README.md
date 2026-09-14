# AAMVA v8 PDF417 Full Field Workbench

This edition adds the complete field set visible in the supplied screenshots.

## Header
- Issuer Identification Number
- AAMVA Version Number (`08`)
- Jurisdiction Version Number
- Number of Entries (automatic)

## Subfiles
Up to five subfile slots with:
- Type
- Offset (automatic)
- Length (automatic)
- Custom data for additional subfiles

## 22 mandatory components
DCA, DCB, DCD, DBA, DCS, DAC, DAD, DBD, DBB, DBC, DAY, DAU, DAG, DAI,
DAJ, DAK, DAQ, DCF, DCG, DDE, DDF, DDG

## 28 optional components
DAH, DAZ, DCI, DCJ, DCK, DBN, DBG, DBS, DCU, DCE, DCL, DCM, DCN, DCO,
DCP, DCQ, DCR, DDA, DDB, DDC, DDD, DAW, DAX, DDH, DDI, DDJ, DDK, DDL

## Jurisdiction-specific components
Arbitrary custom 3-character field IDs and values can be added to the primary subfile.

## Other features
- Real PDF417 rendering with bwip-js
- Automatic AAMVA v8 header construction
- Automatic subfile offsets/lengths
- Raw payload view
- Header/subfile/element inspector
- PNG export and print view
- California QA validation preset

The app does not ship an official state production issuer profile or official jurisdiction-specific credential template.


## iPhone / PWA
This edition is installable as a Progressive Web App when hosted over HTTPS. See `INSTALL-IPHONE.md`.
