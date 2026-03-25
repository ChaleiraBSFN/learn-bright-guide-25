import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Loader2, Shield, BarChart3, Camera, MessageCircle, Settings } from 'lucide-react';
import { AIInfoDialog } from '@/components/AIInfoDialog';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const UserMenu = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { profile, uploadAvatar } = useProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: t('auth.avatarError'), description: t('auth.invalidAvatarType'), variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('auth.avatarError'), description: t('auth.avatarTooLarge'), variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    const result = await uploadAvatar(croppedFile);
    if (result) {
      toast({ title: t('auth.avatarSuccess'), description: t('auth.avatarUpdated') });
    } else {
      toast({ title: t('auth.avatarError'), description: t('auth.avatarUploadFailed'), variant: 'destructive' });
    }
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  if (!user) {
    return (
      <Button variant="ghost" onClick={() => navigate('/auth')}>
        {t('auth.login')}
      </Button>
    );
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <ImageCropDialog
        open={!!cropSrc}
        onClose={() => setCropSrc(null)}
        imageSrc={cropSrc || ''}
        onCropComplete={handleCropComplete}
        fileName="avatar.jpg"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-4 w-4 mr-2" />
            {t('auth.changeAvatar')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            {t('settings.title')}
          </DropdownMenuItem>
          <AIInfoDialog />
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <Shield className="h-4 w-4 mr-2 text-primary" />
                {t('auth.adminPanel')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/manage-users')}>
                <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                {t('admin.manageUsers')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/support-admin')}>
                <MessageCircle className="h-4 w-4 mr-2 text-primary" />
                {t('support.chatTitle')}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              signOut();
            }}
            className="text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('auth.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};