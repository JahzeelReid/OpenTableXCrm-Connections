// import React, { useState, useMemo, useContext, useEffect } from "react";
// import axios from "axios";
// import { AuthContext } from "./authContext";
// import {
//   Button,
//   Select,
//   MenuItem,
//   InputLabel,
//   FormControl,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   Paper,
//   Typography,
//   Box,
//   Stepper,
//   Step,
//   StepLabel,
//   Alert,
//   Checkbox,
//   FormControlLabel,
//   TextField,
//   IconButton,
// } from "@mui/material";
// import {
//   Delete as DeleteIcon,
//   UploadFile as UploadIcon,
// } from "@mui/icons-material";
// import Papa from "papaparse";

// const ContactImporter = (props) => {
//   const [activeStep, setActiveStep] = useState(0);
//   const [csvData, setCsvData] = useState([]); // The raw array of objects
//   const [headers, setHeaders] = useState([]);
//   const [useSplitName, setUseSplitName] = useState(false);
//   const [mapping, setMapping] = useState({
//     firstName: "",
//     lastName: "",
//     fullName: "",
//     phone: "",
//   });
//   const { token, authReady } = useContext(AuthContext);

//   const steps = ["Upload CSV", "Map Columns", "Finalize Data"];

//   // --- LOGIC: Parsing & Mapping ---

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (results) => {
//         const detectedHeaders = Object.keys(results.data[0]);
//         setHeaders(detectedHeaders);
//         setCsvData(results.data);

//         // Smart Mapping Logic
//         const low = (str) => str.toLowerCase();
//         setMapping({
//           fullName:
//             detectedHeaders.find(
//               (x) => low(x).includes("name") && !low(x).includes("first"),
//             ) || "",
//           firstName:
//             detectedHeaders.find((x) => low(x).includes("first")) || "",
//           lastName: detectedHeaders.find((x) => low(x).includes("last")) || "",
//           phone:
//             detectedHeaders.find(
//               (x) =>
//                 low(x).includes("phone") ||
//                 low(x).includes("cell") ||
//                 low(x).includes("mobile"),
//             ) || "",
//         });
//         setActiveStep(1);
//       },
//     });
//   };

//   // --- LOGIC: Validation ---

//   const getPhoneStatus = (phone) => {
//     const digits = String(phone || "").replace(/\D/g, "");
//     if (!digits) return { label: "Required", color: "error", isValid: false };
//     if (digits.length < 10)
//       return { label: "Too Short", color: "warning", isValid: false };
//     if (digits.length > 15)
//       return { label: "Too Long", color: "warning", isValid: false };
//     return { label: "Ready", color: "success", isValid: true };
//   };

//   // --- LOGIC: Data Handling ---

//   const updateCellValue = (index, key, value) => {
//     const newData = [...csvData];
//     newData[index][key] = value;
//     setCsvData(newData);
//   };

//   const removeRow = (index) => {
//     setCsvData(csvData.filter((_, i) => i !== index));
//   };

//   const getDisplayName = (row) => {
//     if (useSplitName) {
//       return `${row[mapping.firstName] || ""} ${row[mapping.lastName] || ""}`.trim();
//     }
//     return row[mapping.fullName] || "";
//   };

//   const handleFinalSubmit = async () => {
//     const payload = csvData.map((row) => ({
//       name: getDisplayName(row),
//       phone: String(row[mapping.phone] || "").replace(/\D/g, ""), // Send clean digits to Flask
//     }));

//     console.log("Sending to Flask:", payload);
//     // await fetch('/api/import', { method: 'POST', body: JSON.stringify(payload) });
//     alert(`Successfully processed ${payload.length} contacts!`);
//   };

//   // Check if Step 2 has any hard errors
//   const hasErrors = csvData.some(
//     (row) => !getPhoneStatus(row[mapping.phone]).isValid,
//   );

//   useEffect(() => {
//     if (!authReady) return;
//     if (!token) return;
//   }, [authReady, token]);

//   const handleSubmit = () => {
//     // 1. Normalize and Map the data
//     // We filter out any rows that might be completely empty by accident
//     const normalizedData = csvData
//       .filter((row) => row[mapping.phone]) // Ensure there's at least a phone value
//       .map((row) => {
//         // Clean the phone number: remove all non-digits
//         const rawPhone = String(row[mapping.phone] || "");
//         const cleanPhone = rawPhone.replace(/\D/g, "");

//         return {
//           name: getDisplayName(row), // Uses the helper we wrote earlier
//           phone: cleanPhone,
//         };
//       });

//     // 2. Perform the Axios request
//     axios({
//       method: "POST",
//       url: `${props.url}/api/import-contacts`,
//       data: { contacts: normalizedData }, // Send as an object or array based on Flask needs
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       withCredentials: true,
//     })
//       .then((response) => {
//         console.log("Import Successful:", response.data);
//         // Optional: Add a success toast here
//       })
//       .catch((error) => {
//         if (error.response) {
//           if (error.response.status === 401) {
//             console.warn("Session expired or invalid token.");
//             localStorage.removeItem("token");
//             navigate("/");
//           } else {
//             // Handle other server-side errors (e.g., 400 Bad Request)
//             console.error("Server Error:", error.response.data);
//           }
//         } else {
//           console.error("Network or Setup Error:", error.message);
//         }
//       });
//   };

//   return (
//     <Box sx={{ maxWidth: 1000, mx: "auto", p: 4 }}>
//       <Typography
//         variant="h4"
//         align="center"
//         gutterBottom
//         sx={{ fontWeight: "bold" }}
//       >
//         Contact Importer
//       </Typography>

//       <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
//         {steps.map((label) => (
//           <Step key={label}>
//             <StepLabel>{label}</StepLabel>
//           </Step>
//         ))}
//       </Stepper>

//       {/* STEP 0: UPLOAD */}
//       {activeStep === 0 && (
//         <Paper
//           variant="outlined"
//           sx={{
//             p: 10,
//             textAlign: "center",
//             borderStyle: "dashed",
//             // bgcolor: "#fafafa",
//           }}
//         >
//           <UploadIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
//           <Typography variant="h6" gutterBottom>
//             Upload your contact list
//           </Typography>
//           <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
//             Accepts .csv files exported from Google, Outlook, or iCloud
//           </Typography>
//           <Button variant="contained" component="label" size="large">
//             Choose CSV File
//             <input
//               type="file"
//               hidden
//               accept=".csv"
//               onChange={handleFileUpload}
//             />
//           </Button>
//         </Paper>
//       )}

//       {/* STEP 1: MAPPING */}
//       {activeStep === 1 && (
//         <Paper sx={{ p: 4 }}>
//           <Typography variant="h6" gutterBottom>
//             Map your Columns
//           </Typography>
//           <FormControlLabel
//             control={
//               <Checkbox
//                 checked={useSplitName}
//                 onChange={(e) => setUseSplitName(e.target.checked)}
//               />
//             }
//             label="My CSV has separate First and Last name columns"
//             sx={{ mb: 3 }}
//           />

//           <Box
//             sx={{
//               display: "grid",
//               gridTemplateColumns: "1fr 1fr",
//               gap: 3,
//               mb: 4,
//             }}
//           >
//             {!useSplitName ? (
//               <FormControl fullWidth>
//                 <InputLabel>Full Name Column</InputLabel>
//                 <Select
//                   value={mapping.fullName}
//                   onChange={(e) =>
//                     setMapping({ ...mapping, fullName: e.target.value })
//                   }
//                   label="Full Name Column"
//                 >
//                   {headers.map((h) => (
//                     <MenuItem key={h} value={h}>
//                       {h}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             ) : (
//               <>
//                 <FormControl fullWidth>
//                   <InputLabel>First Name</InputLabel>
//                   <Select
//                     value={mapping.firstName}
//                     onChange={(e) =>
//                       setMapping({ ...mapping, firstName: e.target.value })
//                     }
//                     label="First Name"
//                   >
//                     {headers.map((h) => (
//                       <MenuItem key={h} value={h}>
//                         {h}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//                 <FormControl fullWidth>
//                   <InputLabel>Last Name</InputLabel>
//                   <Select
//                     value={mapping.lastName}
//                     onChange={(e) =>
//                       setMapping({ ...mapping, lastName: e.target.value })
//                     }
//                     label="Last Name"
//                   >
//                     {headers.map((h) => (
//                       <MenuItem key={h} value={h}>
//                         {h}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </>
//             )}
//             <FormControl fullWidth error={!mapping.phone}>
//               <InputLabel>Phone Number Column</InputLabel>
//               <Select
//                 value={mapping.phone}
//                 onChange={(e) =>
//                   setMapping({ ...mapping, phone: e.target.value })
//                 }
//                 label="Phone Number Column"
//               >
//                 {headers.map((h) => (
//                   <MenuItem key={h} value={h}>
//                     {h}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Box>

//           <Box sx={{ display: "flex", justifyContent: "space-between" }}>
//             <Button onClick={() => setActiveStep(0)}>Back</Button>
//             <Button
//               variant="contained"
//               onClick={() => setActiveStep(2)}
//               disabled={!mapping.phone}
//             >
//               Review {csvData.length} Contacts
//             </Button>
//           </Box>
//         </Paper>
//       )}

//       {/* STEP 2: EDIT & VALIDATE */}
//       {activeStep === 2 && (
//         <Paper sx={{ p: 4 }}>
//           <Box
//             sx={{
//               mb: 3,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             <Typography variant="h6">Final Review</Typography>
//             {hasErrors && (
//               <Alert severity="error">
//                 Please fix invalid phone numbers before importing.
//               </Alert>
//             )}
//           </Box>

//           <Box
//             sx={{ maxHeight: 500, overflow: "auto", border: "1px solid #eee" }}
//           >
//             <Table stickyHeader size="small">
//               <TableHead>
//                 <TableRow>
//                   <TableCell>Name</TableCell>
//                   <TableCell>Phone Number</TableCell>
//                   <TableCell>Status</TableCell>
//                   <TableCell align="right">Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {csvData.map((row, index) => {
//                   const status = getPhoneStatus(row[mapping.phone]);
//                   return (
//                     <TableRow key={index} hover>
//                       <TableCell>
//                         <TextField
//                           variant="standard"
//                           fullWidth
//                           value={getDisplayName(row)}
//                           InputProps={{ disableUnderline: true }}
//                           onChange={(e) => {
//                             if (useSplitName) {
//                               updateCellValue(
//                                 index,
//                                 mapping.firstName,
//                                 e.target.value,
//                               );
//                               updateCellValue(index, mapping.lastName, ""); // Simplified for editing
//                             } else {
//                               updateCellValue(
//                                 index,
//                                 mapping.fullName,
//                                 e.target.value,
//                               );
//                             }
//                           }}
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <TextField
//                           variant="standard"
//                           fullWidth
//                           value={row[mapping.phone] || ""}
//                           error={!status.isValid}
//                           InputProps={{ disableUnderline: true }}
//                           onChange={(e) =>
//                             updateCellValue(
//                               index,
//                               mapping.phone,
//                               e.target.value,
//                             )
//                           }
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <Alert
//                           icon={false}
//                           severity={status.color}
//                           sx={{
//                             py: 0,
//                             px: 1,
//                             fontSize: "0.7rem",
//                             display: "inline-flex",
//                           }}
//                         >
//                           {status.label}
//                         </Alert>
//                       </TableCell>
//                       <TableCell align="right">
//                         <IconButton
//                           size="small"
//                           onClick={() => removeRow(index)}
//                           color="error"
//                         >
//                           <DeleteIcon fontSize="small" />
//                         </IconButton>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </Box>

//           <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
//             <Button onClick={() => setActiveStep(1)}>Back to Mapping</Button>
//             <Button
//               variant="contained"
//               color="success"
//               size="large"
//               onClick={handleSubmit}
//               disabled={hasErrors || csvData.length === 0}
//             >
//               Confirm & Import All
//             </Button>
//           </Box>
//         </Paper>
//       )}
//     </Box>
//   );
// };

// export default ContactImporter;

import React, { useState, useMemo, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./authContext";
import { useNavigate } from "react-router-dom"; // Added navigate import
import {
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Checkbox,
  FormControlLabel,
  TextField,
  IconButton,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  UploadFile as UploadIcon,
} from "@mui/icons-material";
import Papa from "papaparse";

const ContactImporter = (props) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [useSplitName, setUseSplitName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState({
    firstName: "",
    lastName: "",
    fullName: "", // Kept as a fallback for the "Map Columns" logic
    phone: "",
  });
  const { token, authReady } = useContext(AuthContext);

  const steps = ["Upload CSV", "Map Columns", "Finalize Data"];

  // --- LOGIC: Parsing & Mapping ---

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const detectedHeaders = Object.keys(results.data[0]);
        setHeaders(detectedHeaders);
        setCsvData(results.data);

        const low = (str) => str.toLowerCase();
        setMapping({
          fullName:
            detectedHeaders.find(
              (x) => low(x).includes("name") && !low(x).includes("first"),
            ) || "",
          firstName:
            detectedHeaders.find((x) => low(x).includes("first")) || "",
          lastName: detectedHeaders.find((x) => low(x).includes("last")) || "",
          phone:
            detectedHeaders.find(
              (x) =>
                low(x).includes("phone") ||
                low(x).includes("cell") ||
                low(x).includes("mobile"),
            ) || "",
        });

        // Auto-switch to split name if both first/last are found
        if (
          detectedHeaders.some((x) => low(x).includes("first")) &&
          detectedHeaders.some((x) => low(x).includes("last"))
        ) {
          setUseSplitName(true);
        }

        setActiveStep(1);
      },
    });
  };

  // --- LOGIC: Validation ---

  const getPhoneStatus = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return { label: "Required", color: "error", isValid: false };
    if (digits.length < 10)
      return { label: "Too Short", color: "warning", isValid: false };
    if (digits.length > 15)
      return { label: "Too Long", color: "warning", isValid: false };
    return { label: "Ready", color: "success", isValid: true };
  };

  // --- LOGIC: Data Handling ---

  const updateCellValue = (index, key, value) => {
    const newData = [...csvData];
    newData[index][key] = value;
    setCsvData(newData);
  };

  const removeRow = (index) => {
    setCsvData(csvData.filter((_, i) => i !== index));
  };

  // --- LOGIC: Submission & Normalization ---

  const handleSubmit = () => {
    setLoading(true);

    const normalizedData = csvData
      .filter((row) => row[mapping.phone])
      .map((row) => {
        const rawPhone = String(row[mapping.phone] || "");

        // Split name logic for backend consistency
        let finalFirst = "";
        let finalLast = "";

        if (useSplitName) {
          finalFirst = row[mapping.firstName] || "";
          finalLast = row[mapping.lastName] || "";
        } else {
          // If they mapped a "Full Name" column, split it by first space
          const full = (row[mapping.fullName] || "").trim().split(" ");
          finalFirst = full[0] || "";
          finalLast = full.slice(1).join(" ") || "";
        }

        return {
          first_name: finalFirst,
          last_name: finalLast,
          phone: rawPhone.replace(/\D/g, ""), // Final digit-only normalization
        };
      });

    axios({
      method: "POST",
      url: `${props.url}/api/import-contacts`,
      data: { contacts: normalizedData },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    })
      .then((response) => {
        console.log("Import Successful:", response.data);
        setActiveStep(0);
        setCsvData([]);
        alert(`Successfully imported ${normalizedData.length} contacts.`);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
        console.error("Submission error:", error);
      })
      .finally(() => setLoading(false));
  };

  const hasErrors = csvData.some(
    (row) => !getPhoneStatus(row[mapping.phone]).isValid,
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 4 }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Contact Importer
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* STEP 0: UPLOAD */}
      {activeStep === 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 10, textAlign: "center", borderStyle: "dashed" }}
        >
          <UploadIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6">Upload CSV</Typography>
          <Button
            variant="contained"
            component="label"
            size="large"
            sx={{ mt: 2 }}
          >
            Choose File
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleFileUpload}
            />
          </Button>
        </Paper>
      )}

      {/* STEP 1: MAPPING */}
      {activeStep === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Map Columns
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={useSplitName}
                onChange={(e) => setUseSplitName(e.target.checked)}
              />
            }
            label="Use separate First and Last name columns"
            sx={{ mb: 3 }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              mb: 4,
            }}
          >
            {useSplitName ? (
              <>
                <FormControl fullWidth>
                  <InputLabel>First Name</InputLabel>
                  <Select
                    value={mapping.firstName}
                    onChange={(e) =>
                      setMapping({ ...mapping, firstName: e.target.value })
                    }
                    label="First Name"
                  >
                    {headers.map((h) => (
                      <MenuItem key={h} value={h}>
                        {h}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Last Name</InputLabel>
                  <Select
                    value={mapping.lastName}
                    onChange={(e) =>
                      setMapping({ ...mapping, lastName: e.target.value })
                    }
                    label="Last Name"
                  >
                    {headers.map((h) => (
                      <MenuItem key={h} value={h}>
                        {h}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Full Name Column</InputLabel>
                <Select
                  value={mapping.fullName}
                  onChange={(e) =>
                    setMapping({ ...mapping, fullName: e.target.value })
                  }
                  label="Full Name Column"
                >
                  {headers.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth error={!mapping.phone}>
              <InputLabel>Phone Number Column</InputLabel>
              <Select
                value={mapping.phone}
                onChange={(e) =>
                  setMapping({ ...mapping, phone: e.target.value })
                }
                label="Phone Number Column"
              >
                {headers.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={!mapping.phone}
            >
              Review Data
            </Button>
          </Box>
        </Paper>
      )}

      {/* STEP 2: EDIT & VALIDATE */}
      {activeStep === 2 && (
        <Paper sx={{ p: 4 }}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Final Review</Typography>
            {hasErrors && (
              <Alert severity="error">
                Fix invalid phone numbers to continue.
              </Alert>
            )}
          </Box>

          <Box
            sx={{ maxHeight: 500, overflow: "auto", border: "1px solid #eee" }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {csvData.map((row, index) => {
                  const status = getPhoneStatus(row[mapping.phone]);
                  return (
                    <TableRow key={index} hover>
                      {useSplitName ? (
                        <>
                          <TableCell>
                            <TextField
                              variant="standard"
                              fullWidth
                              value={row[mapping.firstName] || ""}
                              InputProps={{ disableUnderline: true }}
                              onChange={(e) =>
                                updateCellValue(
                                  index,
                                  mapping.firstName,
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              variant="standard"
                              fullWidth
                              value={row[mapping.lastName] || ""}
                              InputProps={{ disableUnderline: true }}
                              onChange={(e) =>
                                updateCellValue(
                                  index,
                                  mapping.lastName,
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                        </>
                      ) : (
                        <TableCell colSpan={2}>
                          <TextField
                            variant="standard"
                            fullWidth
                            value={row[mapping.fullName] || ""}
                            InputProps={{ disableUnderline: true }}
                            onChange={(e) =>
                              updateCellValue(
                                index,
                                mapping.fullName,
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <TextField
                          variant="standard"
                          fullWidth
                          value={row[mapping.phone] || ""}
                          error={!status.isValid}
                          InputProps={{ disableUnderline: true }}
                          onChange={(e) =>
                            updateCellValue(
                              index,
                              mapping.phone,
                              e.target.value,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Alert
                          icon={false}
                          severity={status.color}
                          sx={{
                            py: 0,
                            px: 1,
                            fontSize: "0.7rem",
                            display: "inline-flex",
                          }}
                        >
                          {status.label}
                        </Alert>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => removeRow(index)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button onClick={() => setActiveStep(1)}>Back</Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleSubmit}
              disabled={hasErrors || csvData.length === 0 || loading}
            >
              {loading ? "Importing..." : "Confirm & Import All"}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ContactImporter;
