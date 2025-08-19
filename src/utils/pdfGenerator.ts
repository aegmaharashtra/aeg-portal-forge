import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProfileData {
  name: string;
  email: string;
  contact: string;
  gender: string;
  dob: string;
  age: number;
  district: string;
  category: string;
  highest_qualification: string;
  passport_photo_url?: string;
  user_pass_id: string;
}

export const generateUserPass = async (profileData: ProfileData): Promise<void> => {
  try {
    // Create a temporary container for the pass design
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '400px';
    container.style.padding = '20px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.border = '2px solid #0066cc';
    container.style.borderRadius = '8px';

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #2563eb); color: white; padding: 10px; margin: -20px -20px 20px -20px; border-radius: 6px 6px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">AEG PORTAL</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Maharashtra Government Initiative</p>
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div style="flex: 1;">
            <h2 style="color: #059669; margin: 0 0 10px 0; font-size: 20px;">Registration Pass</h2>
            <div style="background: #f3f4f6; padding: 8px; border-radius: 4px; display: inline-block;">
              <span style="font-size: 18px; font-weight: bold; color: #1f2937;">ID: ${profileData.user_pass_id}</span>
            </div>
          </div>
          ${profileData.passport_photo_url ? `
            <div style="margin-left: 20px;">
              <img src="${profileData.passport_photo_url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 2px solid #e5e7eb;" />
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Personal Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
          <div><strong>Name:</strong> ${profileData.name}</div>
          <div><strong>Gender:</strong> ${profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1)}</div>
          <div><strong>Age:</strong> ${profileData.age}</div>
          <div><strong>DOB:</strong> ${new Date(profileData.dob).toLocaleDateString()}</div>
          <div style="grid-column: 1 / -1;"><strong>Contact:</strong> ${profileData.contact}</div>
          <div style="grid-column: 1 / -1;"><strong>Email:</strong> ${profileData.email}</div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Additional Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
          <div><strong>District:</strong> ${profileData.district}</div>
          <div><strong>Category:</strong> ${profileData.category}</div>
          <div style="grid-column: 1 / -1;"><strong>Qualification:</strong> ${profileData.highest_qualification}</div>
        </div>
      </div>

      <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Generated on ${new Date().toLocaleDateString()} • AEG Portal System<br/>
          This is an official registration pass issued by Maharashtra Government
        </p>
      </div>
    `;

    document.body.appendChild(container);

    // Wait for images to load if any
    const images = container.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => new Promise(resolve => {
      if (img.complete) {
        resolve(true);
      } else {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      }
    })));

    // Convert to canvas
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 180;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 15, 20, imgWidth, imgHeight);
    
    // Download the PDF
    pdf.save(`AEG_Pass_${profileData.user_pass_id}.pdf`);

    // Clean up
    document.body.removeChild(container);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF pass');
  }
};