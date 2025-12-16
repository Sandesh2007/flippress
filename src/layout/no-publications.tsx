import Link from "next/link";
import { Button } from "@/components";
import { Sparkles } from "lucide-react";
import logo from "../../public/logo.svg";

export const NoPublications = () =>  {

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 glass rounded-full flex items-center justify-center mx-auto mb-6">
                    <img
                        src={logo.src}
                        draggable="false"
                        alt="logo"
                        className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gradient-hero">No publications yet</h3>
                <p className="text-muted-foreground mb-8 text-lg">Start sharing your work with the world</p>
                <Link href="/home/create">
                    <Button className="transition-all duration-200 text-primary hover:scale-105 glass hover:shadow-glow px-8 py-3 rounded-xl">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Create Your First Publication
                    </Button>
                </Link>
            </div>
        </div>
    );
}
