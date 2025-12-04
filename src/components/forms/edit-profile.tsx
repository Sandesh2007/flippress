'use client'

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Settings, Upload } from 'lucide-react'
import { createBrowserClient } from '@/lib/database'
import toast from 'react-hot-toast'
import { useAuth } from '../auth/auth-context'
import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import Image from 'next/image'
import { v4 as uuidv4 } from 'uuid';
import { CountryDropdown, Country } from '@/components/ui/country-dropdown'

export default function EditProfile() {
    const { user, refreshUser } = useAuth();
    const supabase = createBrowserClient();
    const [open, setOpen] = useState(false);
    const [bio, setBio] = useState(user?.bio || '');
    const [username, setUsername] = useState(user?.username || '');
    const [location, setLocation] = useState(user?.location || '');
    const [image, setImage] = useState<File | null>(null);
    const currentProfileImage = useCurrentUserImage();
    const [avatarUrl, setAvatarUrl] = useState(currentProfileImage);
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setBio(user.bio || '');
            setLocation(user.location || '');
            setAvatarUrl(currentProfileImage);
        }
    }, [user, currentProfileImage]);

    const handleCountryChange = (country: Country) => {
        setLocation(country.name);
    };

    const validateUsername = async (username: string) => {
        if (username !== username.toLowerCase()) {
            setUsernameError('Username must be lowercase.');
            return false;
        }
        if (!/^[a-z0-9_\s]+$/.test(username)) {
            setUsernameError('Username can only contain lowercase letters, numbers, underscores, and spaces.');
            return false;
        }
        // Check uniqueness (exclude current user)
        const supabase = createBrowserClient();
        const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .neq('id', user?.id); // Exclude current user
        if (data && data.length > 0) {
            setUsernameError('Username is already taken.');
            return false;
        }
        setUsernameError('');
        return true;
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Reset form to original values
            setUsername(user?.username || '');
            setBio(user?.bio || '');
            setLocation(user?.location || '');
            setAvatarUrl(currentProfileImage);
            setImage(null);
            setUsernameError('');
        }
    };

    const updateProfile = async () => {
        if (!user?.id) return;
        // Remove spaces from username before saving
        const sanitizedUsername = username.replace(/\s+/g, '');
        if (sanitizedUsername !== user?.username) {
            if (!(await validateUsername(sanitizedUsername))) return;
        }

        let uploadedAvatarUrl = avatarUrl;

        if (image) {
            try {
                console.log('Starting image upload...', {
                    fileName: image.name,
                    fileSize: image.size,
                    fileType: image.type,
                    userId: user.id
                });

                const fileExt = image.name.split('.').pop();
                const fileName = `${user.id}/${uuidv4()}.${fileExt}`;

                console.log('Generated file path:', fileName);

                const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
                console.log('Available buckets:', buckets);
                if (bucketsError) {
                    console.error('Error listing buckets:', bucketsError);
                    toast.error('Storage configuration error');
                    return;
                }

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, image, {
                        upsert: true,
                        contentType: image.type
                    });

                console.log('Upload response:', { uploadData, uploadError });

                if (uploadError) {
                    console.error('Upload error details:', uploadError);
                    toast.error(`Failed to upload avatar: ${uploadError.message}`);
                    return;
                } else {
                    console.log('Upload successful:', uploadData);

                    // Get the public URL
                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);

                    console.log('Public URL:', publicUrlData.publicUrl);
                    uploadedAvatarUrl = publicUrlData.publicUrl;

                    // Verify the file was actually uploaded
                    const { data: fileExists, error: listError } = await supabase.storage
                        .from('avatars')
                        .list(user.id);

                    console.log('Files in user folder:', fileExists);
                    if (listError) {
                        console.error('Error listing files:', listError);
                    }
                }
            } catch (error) {
                console.error('Unexpected error during upload:', error);
                toast.error('Unexpected error during upload');
                return;
            }
        }

        // Continue with profile update
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: sanitizedUsername.toLowerCase(), // THis ensures lowercase and no spaces
                    bio,
                    location,
                    avatar_url: uploadedAvatarUrl,
                })
                .eq('id', user.id);

            if (error) {
                console.error('Profile update error:', error);
                toast.error('Failed to update profile');
                toast.error(error.message);
            } else {
                console.log('Profile updated successfully');
                toast.success('Profile updated', { duration: 3000 });
                setAvatarUrl(uploadedAvatarUrl);
            }
        } catch (error) {
            console.error('Unexpected error during profile update:', error);
            toast.error('Unexpected error during profile update');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
            </DialogTrigger>

            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="sm:max-w-md dark:bg-neutral-900">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-1">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-black dark:text-white">
                            Name
                        </Label>
                        <Input
                            id="name"
                            className="w-full glass outline-0 focus:outline-primary rounded-xl px-4 py-2 text-sm"
                            value={username}
                            onChange={e => setUsername(e.target.value.toLowerCase())}
                        />
                        {usernameError && <div className="text-red-500 text-xs mt-1">{usernameError}</div>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-medium text-black dark:text-white">
                            Bio
                        </Label>
                        <Input
                            type="text"
                            id="bio"
                            className="w-full glass outline-0 focus:outline-primary rounded-xl px-4 py-2 text-sm"
                            placeholder="Short description about you"
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium text-black dark:text-white">
                            Location (Country)
                        </Label>
                        <CountryDropdown
                            placeholder="Select country"
                            defaultValue={location}
                            onChange={handleCountryChange}
                        />
                        {location && (
                            <div className="text-sm text-black dark:text-white mt-1">
                                Selected: {location}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="image" className="text-sm font-medium text-black dark:text-white">
                                Profile Image
                            </Label>
                            <div className="w-full items-center gap-2 p-3 border-2 rounded-2xl">
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    className="bg-background border border-input rounded-xl px-4 py-2 text-sm cursor-pointer hidden"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImage(e.target.files[0]);
                                            setAvatarUrl(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                />
                                <label htmlFor="image" className="flex text-sm font-medium text-gray-300 cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Select Profile Image
                                </label>
                            </div>
                        </div>
                        {avatarUrl && (
                            <div className="mt-2">
                                <Label className="text-sm text-black dark:text-white mb-1 block">Preview</Label>
                                <Image
                                    src={avatarUrl}
                                    alt="Profile Preview"
                                    width={96}
                                    height={96}
                                    className="w-24 h-24 rounded-full object-cover border"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <div
                        className='w-full flex justify-between'
                    >
                        <Button
                            className='cursor-pointer'
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className='cursor-pointer'
                            onClick={async () => {
                                if (!(await validateUsername(username))) return;
                                toast.promise(
                                    updateProfile()
                                        .catch((error) => {
                                            console.error('Error updating profile:', error)
                                            toast.error(error.message)
                                            throw error
                                        }),
                                    {
                                        loading: 'Updating profile...',
                                        success: 'Profile updated',
                                        error: 'Failed to update profile',
                                    }
                                );
                                toast.promise(
                                    refreshUser(),
                                    {
                                        loading: 'Refreshing user...',
                                        success: 'User refreshed',
                                        error: 'Failed to refresh user',
                                    }
                                ).finally(() => {
                                    setOpen(false);
                                });
                            }}
                        >
                            Save
                        </Button>

                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
