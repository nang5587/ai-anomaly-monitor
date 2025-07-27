import FileListClient from "../../components/filelist/FileListClient";
import { getFiles_server } from "../../api/apiServer";

export default async function FileListPage() {
  const initialFiles = await getFiles_server();
  
  return (
    <>
      <FileListClient initialFiles={initialFiles} />
    </>
  );
}
