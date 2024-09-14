import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import axios from "axios"

const BACKEND_URL = "http://localhost:3000";

export function Landing() {
  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploadId) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`${BACKEND_URL}/status?id=${uploadId}`);
          setStatus(response.data.status);
          if (response.data.status === "Deployed") {
            setDeployed(true);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error fetching status:", error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [uploadId]);

  const handleDeploy = async () => {
    setUploading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/deploy`, { repoUrl });
      setUploadId(res.data.id);
    } catch (error) {
      console.error("Error deploying:", error);
      setStatus("Deployment failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Deploy your GitHub Repository</CardTitle>
          <CardDescription>Enter the URL of your GitHub repository to deploy it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub Repository URL</Label>
              <Input 
                onChange={(e) => setRepoUrl(e.target.value)} 
                placeholder="https://github.com/username/repo" 
              />
            </div>
            <Button onClick={handleDeploy} disabled={uploadId !== "" || uploading} className="w-full" type="submit">
              {uploadId ? `Deploying (${uploadId})` : uploading ? "Uploading..." : "Upload"}
            </Button>
            {status && (
              <div className="mt-4 text-center">
                <p>Status: {status}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {deployed && (
        <Card className="w-full max-w-md mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Deployment Status</CardTitle>
            <CardDescription>Your website is successfully deployed!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="deployed-url">Deployed URL</Label>
              <Input id="deployed-url" readOnly type="url" value={`http://${uploadId}.localhost:3001/index.html`} />
            </div>
            <br />
            <Button className="w-full" variant="outline">
              <a href={`http://${uploadId}.localhost:3001/index.html`} target="_blank" rel="noopener noreferrer">
                Visit Website
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  )
}