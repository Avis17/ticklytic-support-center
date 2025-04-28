
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background text-muted-foreground py-4 text-sm">
      <div className="container flex flex-col items-center justify-center">
        <p>&copy; {new Date().getFullYear()} Ticklytic. All rights reserved.</p>
        <p className="mt-1">Developed by Siva - Kuat Technologies</p>
      </div>
    </footer>
  );
};

export default Footer;
