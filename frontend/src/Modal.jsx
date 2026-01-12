import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  Typography,
} from "@mui/material";
import { useEffect, useState, useContext } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "./authContext";
import InputLabel from "@mui/material/InputLabel";

export default function PostModal({
  open,
  onClose,
  selectedDate,
  setSelectedDate,
  selectedPost,
  setSelectedPost,
  onSave,
  links,
  url,
}) {
  const isEdit = Boolean(selectedPost);
  // const [isEdit, setisEdit] = useState(Boolean(selectedPost));

  const [platform, setPlatform] = useState("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState(null);
  const [status, setstatus] = useState(null);
  const [postId, setPostId] = useState(null);

  const [mode, setMode] = useState("manual");
  const promotion = [
    "Reservations",
    "Featured Dish",
    "Featured Drink",
    "Dessert Special",
    "Event / Entertainment Night",
    "Happy Hour",
    "Brunch",
    "Catering Service",
    "Customer Win-Back",
    "New Menu Item",
    "Seasonal / Holiday Special",
    "Loyalty / VIP Message",
  ];
  const [link, setLink] = useState(null);
  const [promo, setPromotion] = useState(null);
  const TIME_OPTIONS = [
    { label: "8:00 AM", value: "13:00" }, // 08:00 EST
    { label: "12:00 PM", value: "17:00" }, // 12:00 EST
    { label: "4:00 PM", value: "21:00" }, // 16:00 EST
    { label: "8:00 PM", value: "01:00", nextDay: true }, // 20:00 EST
  ];

  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, authReady } = useContext(AuthContext);
  const [note, setNote] = useState("");
  const [alertmessage, setAlertMessage] = useState("");
  const [prevdate, setPrev] = useState(null);

  // Adds one day to a date string (YYYY-MM-DD) or Date object
  const addOneDay = (dateInput) => {
    // Ensure we have a Date object
    const d =
      typeof dateInput === "string"
        ? new Date(`${dateInput}T00:00:00`)
        : new Date(dateInput);

    // Increment by one day
    d.setDate(d.getDate() + 1);

    // Return in YYYY-MM-DD format
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const buildScheduledAt = (dateInput, option) => {
    if (!dateInput || !option) return null;

    const d = new Date(dateInput);

    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");

    let dateStr = `${yyyy}-${mm}-${dd}`;

    if (option.nextDay) {
      dateStr = addOneDay(dateStr);
    }

    return `${dateStr}T${option.value}:00Z`;
  };

  const handleGenerateMessage = () => {
    setLoading(true);
    axios({
      method: "POST",
      url: `${url}/api/generate_message`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        promotion: promo,
        link: link,
        info: {
          date: selectedDate,
          user_notes: note,
          release_time: scheduledAt,
        },
      },
      withCredentials: true,
    })
      .then((response) => {
        setContent(response.data.message);
        setMode("manual");
        setAlertMessage(
          "Automated message generated. Please review and edit as needed. Click auto to regenerate"
        );
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
        setAlertMessage(
          "Error generating automated message. Please try again."
        );
        console.log(error.response);
      })
      .finally(() => {
        setLoading(false);
        alert(alertmessage);
      });
  };

  const handlesubmit = () => {
    if (isEdit) {
      // edit post, honestly the same but it sends id
      axios({
        method: "POST",
        url: `${url}/api/update_scheduled_post`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          promotion: promo,
          link: link,
          content: content,
          scheduled_at: scheduledAt,
          mode: mode,
          id: postId,
        },
        withCredentials: true,
      })
        .then((response) => {
          setAlertMessage(response.data.message);
          console.log(new Date("2026-01-14T21:00:00Z").toString());
          // alert(new Date(scheduledAt).toString());
        })
        .catch((error) => {
          setAlertMessage("Error scheduling post. Please try again.");
          if (error.response && error.response.status === 401) {
            console.warn("Session expired or invalid token.");
            localStorage.removeItem("token"); // optional: clear stored token
            navigate("/");
          }
          console.log(error.response);
        })
        .finally(() => {
          setLoading(false);
          alert(alertmessage);
        });
    } else {
      axios({
        method: "POST",
        url: `${url}/api/schedule_post_new`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          promotion: promo,
          link: link,
          content: content,
          scheduled_at: scheduledAt,
          mode: mode,
        },
        withCredentials: true,
      })
        .then((response) => {
          setAlertMessage(response.data.message);
          console.log(new Date("2026-01-14T21:00:00Z").toString());
          // alert(new Date(scheduledAt).toString());
        })
        .catch((error) => {
          setAlertMessage("Error scheduling post. Please try again.");
          if (error.response && error.response.status === 401) {
            console.warn("Session expired or invalid token.");
            localStorage.removeItem("token"); // optional: clear stored token
            navigate("/");
          }
          console.log(error.response);
        })
        .finally(() => {
          setLoading(false);
          alert(alertmessage);
        });
    }
  };

  const getTimeOptionIndexFromUTC = (scheduledAtUtc, TIME_OPTIONS) => {
    if (!scheduledAtUtc) return null;

    const date = new Date(scheduledAtUtc);

    // Get HH:mm in UTC
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const utcTime = `${hours}:${minutes}`;

    return TIME_OPTIONS.findIndex((option) => option.value === utcTime);
  };

  const handleDupeDelete = () => {
    if (status === "posted") {
      // duplicate
      // setisEdit(false);
      setSelectedPost(null);
      setstatus(null);
      setPrev(scheduledAt);
    } else {
      axios({
        method: "POST",
        url: `${url}/api/delete_scheduled_post`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          id: postId,
        },
        withCredentials: true,
      })
        .then((response) => {
          setAlertMessage(response.data.message);
          console.log(new Date("2026-01-14T21:00:00Z").toString());
          // alert(new Date(scheduledAt).toString());
        })
        .catch((error) => {
          setAlertMessage("Error scheduling post. Please try again.");
          if (error.response && error.response.status === 401) {
            console.warn("Session expired or invalid token.");
            localStorage.removeItem("token"); // optional: clear stored token
            navigate("/");
          }
          console.log(error.response);
        })
        .finally(() => {
          setLoading(false);
          alert(alertmessage);
        });
      onClose();
    }
  };

  // Populate fields when editing
  // useEffect(() => {
  //   if (isEdit) {
  //     setPlatform(selectedPost.platform);
  //     setLink(selectedPost.extendedProps.link);
  //     setContent(selectedPost.extendedProps?.content || "");
  //     setPromotion(selectedPost.extendedProps?.promotion || null);
  //     setScheduledAt(
  //       selectedPost.start instanceof Date
  //         ? selectedPost.start.toISOString()
  //         : selectedPost.start
  //     );
  //     const idx = getTimeOptionIndexFromUTC(
  //       selectedPost.extendedProps.scheduled_at,
  //       TIME_OPTIONS
  //     );

  //     setSelectedTime(idx >= 0 ? idx : null);
  //     setSelectedDate(scheduledAt);
  //     setstatus(selectedPost.extendedProps?.status);
  //   } else if (selectedDate) {
  //     setScheduledAt(
  //       selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate
  //     );
  //     setScheduledAt(selectedDate);
  //     setPlatform("");
  //     setContent("");
  //   }
  // }, [isEdit, selectedPost, selectedDate]);

  useEffect(() => {
    if (!open) return;

    if (selectedPost) {
      // Edit mode
      setPlatform(selectedPost.platform);
      setLink(selectedPost.extendedProps.link);
      setContent(selectedPost.extendedProps?.content || "");
      setPromotion(selectedPost.extendedProps?.promotion || null);
      setScheduledAt(
        selectedPost.start instanceof Date
          ? selectedPost.start.toISOString()
          : selectedPost.start
      );
      const idx = getTimeOptionIndexFromUTC(
        selectedPost.extendedProps.scheduled_at,
        TIME_OPTIONS
      );

      setSelectedTime(idx >= 0 ? idx : null);
      setSelectedDate(scheduledAt);
      setstatus(selectedPost.extendedProps?.status);
      setPostId(selectedPost.id);
    } else {
      // Create mode
      setScheduledAt(
        selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate
      );
      // setScheduledAt(selectedDate);
      setPlatform("");
      setContent("");
    }
  }, [open]);

  const handleSave = () => {
    onSave({
      platform,
      content,
      scheduledAt,
      id: selectedPost?.id,
    });
    handlesubmit();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit Post" : "Schedule Post"}</DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* <Typography>{scheduledAt}</Typography> */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(e, value) => value && setMode(value)}
          aria-label="mode selection"
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="auto">Auto</ToggleButton>
          <ToggleButton value="manual">Manual</ToggleButton>
        </ToggleButtonGroup>
        {loading === false ? (
          <>
            {mode === "auto" ? (
              <>
                <FormControl
                  fullWidth
                  size="small"
                  //   error={hasError(day, day.promotion)}
                >
                  <InputLabel id="Promo">Promotion</InputLabel>
                  <Select
                    label="Promotion"
                    value={promo}
                    onChange={(e) => setPromotion(e.target.value)}
                    displayEmpty
                    disabled={status === "posted"}
                  >
                    <MenuItem value="" disabled>
                      Select Promotion
                    </MenuItem>
                    {promotion.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Extra Info / Notes"
                  multiline
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={status === "posted"}
                />

                <FormControl
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  //   error={hasError(day, day.link)}
                >
                  <InputLabel id="Link">Link</InputLabel>
                  <Select
                    label="Link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    displayEmpty
                    disabled={status === "posted"}
                  >
                    <MenuItem value="" disabled>
                      Select Link
                    </MenuItem>
                    {links.map((link) => (
                      <MenuItem key={link} value={link}>
                        {link}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleGenerateMessage}>
                  Generate Message
                </Button>
              </>
            ) : (
              <TextField
                label="Post content"
                multiline
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={status === "posted"}
              />
            )}
          </>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              Loading Automated Message
            </Typography>
            <CircularProgress size={24} />
          </>
        )}
        <FormControl
          fullWidth
          size="small"
          // error={hasError(day, day.time)}
        >
          <InputLabel id="Time Label">Scheduled Time</InputLabel>

          <Select
            label="Scheduled Time"
            value={selectedTime}
            onChange={(e) => {
              const idx = e.target.value;
              const option = TIME_OPTIONS[e.target.value];
              // const iso = buildScheduledAt(selectedDate, option);
              const iso = buildScheduledAt(scheduledAt, option);

              alert("before set: " + scheduledAt + "\n" + "after set: " + iso);
              setScheduledAt(iso);
              setSelectedTime(idx);
            }}
            disabled={status === "posted"}
          >
            {TIME_OPTIONS.map((o, idx) => (
              <MenuItem key={o.label} value={idx}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Scheduled Date"
          type="date"
          value={
            typeof scheduledAt === "string" ? scheduledAt.slice(0, 10) : ""
          }
          onChange={(e) => {
            const date = e.target.value;

            // Preserve time if it exists, otherwise default
            const time = scheduledAt?.slice(11, 16) || "08:00";

            setScheduledAt(`${date}T${time}:00Z`);
          }}
          InputLabelProps={{ shrink: true }}
          error={scheduledAt?.slice(0, 10) === prevdate?.slice(0, 10)}
          disabled={status === "posted"}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {status !== "posted" && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={content.trim() === ""}
          >
            {isEdit ? "Update" : "Create"}
          </Button>
        )}

        {isEdit && (
          <Button variant="contained" onClick={handleDupeDelete}>
            {status === "posted" ? "Duplicate" : "Delete"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
