import Sidebar from "./sidebar";
import ContactImporter from "./ImportContacts";
export default function SettingsPage(props) {
  return (
    <>
      <Sidebar />
      <ContactImporter url={props.url} />
    </>
  );
}
