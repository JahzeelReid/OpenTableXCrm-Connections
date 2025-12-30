import { Dialog, DialogTitle, DialogContent, Button } from "@mui/material";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { TextField, Typography, Select, MenuItem } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import axios from "axios";
import React, { use, useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "./authContext";
import CircularProgress from "@mui/material/CircularProgress";

export default function PostEditor({
  open,
  onClose,
  content,
  setContent,
  setImage,
  handleSubmit,
  url,
  loading,
}) {
  const [selectedPromotion, setSelectedPromotion] = React.useState("");
  const [eventName, setEventName] = React.useState("");
  const [discount, setDiscount] = React.useState(false);
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [discountText, setDiscountText] = React.useState("");
  const [releaseDate, setReleaseDate] = React.useState("");
  const [releaseTime, setReleaseTime] = React.useState("");
  const [link, setLink] = React.useState("");
  const [releaseType, setReleaseType] = React.useState("");
  const [linklist, setLinkList] = useState({ links: [] });
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
  const { token, authReady } = useContext(AuthContext);

  useEffect(() => {
    setContent({
      selectedPromotion,
      eventName,
      discount,
      discountAmount,
      discountText,
      releaseDate,
      releaseTime,
      releaseType,
      link,
      loading,
    });
  }, [
    selectedPromotion,
    eventName,
    discount,
    discountAmount,
    discountText,
    releaseDate,
    releaseTime,
    releaseType,
    link,
    loading,
  ]);

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  const getLinkList = () => {
    axios({
      method: "GET",
      url: `${url}/api/get_tracked_links`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        setLinkList(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Session expired or invalid token.");
          localStorage.removeItem("token"); // optional: clear stored token
          navigate("/");
        }
        console.log(error.response);
        console.log(error.response.status);
        console.log(error.response.headers);
      });
  };
  useEffect(() => {
    if (!authReady) return;
    if (!token) return;
    getLinkList();
  }, [authReady, token]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Create New Post</DialogTitle>
      <DialogContent>
        <FormControl>
          <FormLabel id="Promotion-Select">
            What would you like to promote? (Choose one)
          </FormLabel>
          <RadioGroup
            aria-labelledby="Promotion-Select-group-label"
            name="Promotion-Select-group"
            onChange={(e) => setSelectedPromotion(e.target.value)}
          >
            {promotion.map((item) => (
              // <MenuItem key={item} value={item}>
              //   {item}
              // </MenuItem>
              <FormControlLabel value={item} control={<Radio />} label={item} />
            ))}
          </RadioGroup>
        </FormControl>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Item or Event Name
        </Typography>
        <TextField
          fullWidth
          placeholder="Enter the item or event you want to promote"
          helperText="Example: Honey Garlic Wings / Karaoke Night"
          variant="outlined"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
        <FormControl>
          <FormLabel id="Discount-Select">
            Would you like to include a discount?
          </FormLabel>
          <RadioGroup
            aria-labelledby="Discount-Select-label"
            name="Discount-Select"
            onChange={(e) => {
              setDiscount(e.target.value);
              setDiscountAmount("");
            }}
          >
            <FormControlLabel value={true} control={<Radio />} label="Yes" />
            <FormControlLabel value="" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
        {discount && (
          <FormControl>
            <FormLabel id="Discount-Amount">
              {" "}
              What discount would you like to offer?
            </FormLabel>
            <RadioGroup
              aria-labelledby="Discount-Amount-label"
              name="Discount-Amount"
              onChange={(e) => {
                setDiscountAmount(e.target.value);
                setDiscountText("");
              }}
            >
              <FormControlLabel
                value="Percentage Off"
                control={<Radio />}
                label={
                  <>
                    Percentage Off:
                    {discountAmount === "Percentage Off" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="20)"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        }}
                        sx={{ ml: 2, mt: 1, width: 100 }}
                      />
                    )}
                  </>
                }
              />
              <FormControlLabel
                value="Dollar Amount Off"
                control={<Radio />}
                label={
                  <>
                    Dollar Amount Off:
                    {discountAmount === "Dollar Amount Off" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="5"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                        sx={{ ml: 2, mt: 1, width: 100 }}
                      />
                    )}
                  </>
                }
              />
              <FormControlLabel
                value="Free Item"
                control={<Radio />}
                label={
                  <>
                    Free Item
                    {discountAmount === "Free Item" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Garlic knots"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        sx={{ ml: 2, mt: 1, width: 200 }}
                      />
                    )}
                  </>
                }
              />
              <FormControlLabel
                value="BOGO Item"
                control={<Radio />}
                label={
                  <>
                    BOGO Item:
                    {discountAmount === "BOGO Item" && (
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Wings"
                        value={discountText}
                        onChange={(e) => setDiscountText(e.target.value)}
                        sx={{ ml: 2, mt: 1, width: 200 }}
                      />
                    )}
                  </>
                }
              />
            </RadioGroup>
          </FormControl>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{ marginTop: "1rem" }}
        />
        <FormControl>
          <FormLabel id="Release-Date-label"> Release Date </FormLabel>
          <RadioGroup>
            <FormControlLabel value={"ASAP"} control={<Radio />} label="ASAP" />
            <FormControlLabel
              value={"Schedule"}
              control={<Radio />}
              label="Schedule for later"
              onChange={(e) => setReleaseType(e.target.value)}
            />
          </RadioGroup>
          {releaseType === "Schedule" && (
            <>
              <FormControl>
                <Select
                  value={releaseTime}
                  onChange={(e) => setReleaseTime(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Post Time
                  </MenuItem>
                  <MenuItem value="0">08:00 AM</MenuItem>
                  <MenuItem value="1">12:00 PM</MenuItem>
                  <MenuItem value="2">04:00 PM</MenuItem>
                  <MenuItem value="3">08:00 PM</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <Select
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select Day of Week
                  </MenuItem>
                  <MenuItem value="6">Sunday</MenuItem>
                  <MenuItem value="0">Monday</MenuItem>
                  <MenuItem value="1">Tuesday</MenuItem>
                  <MenuItem value="2">Wednesday</MenuItem>
                  <MenuItem value="3">Thursday</MenuItem>
                  <MenuItem value="4">Friday</MenuItem>
                  <MenuItem value="5">Saturday</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </FormControl>
        <FormControl fullWidth size="small" sx={{ mt: 2 }}>
          <Select
            value={link}
            onChange={(e) => setLink(e.target.value)}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select Link
            </MenuItem>
            {linklist.links.map((link1) => (
              <MenuItem key={link1} value={link1}>
                {link1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Submit Post"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// 12 messages a month
// 3 messages a week
// upload menu to dashboard
// scrape menu items for promotion suggestions
// take menu items and create posts automatically
// have the ai choose the best menu item to promote
// have the ai create custom messages for each promotion
// 12 messages a month
