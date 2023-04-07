<?php

declare(strict_types=1);

namespace MageSuite\WidgetNotificationModal\Plugin\MagentoWidget\Model\Widget\Instance;

class ReplaceUrlToWidgetImages
{
    protected \MageSuite\FileUpload\Model\ParseFilePathFromMediaDirectoryUrl $parseFilePathFromMediaDirectoryUrl;

    public function __construct(
        \MageSuite\FileUpload\Model\ParseFilePathFromMediaDirectoryUrl $parseFilePathFromMediaDirectoryUrl
    ) {
        $this->parseFilePathFromMediaDirectoryUrl = $parseFilePathFromMediaDirectoryUrl;
    }

    public function beforeSetData(\Magento\Widget\Model\Widget\Instance $subject, $key, $data = null): ?array
    {
        if ($key !== 'widget_parameters') {
            return null;
        }

        if (!is_array($data)) {
            return null;
        }

        foreach (\MageSuite\WidgetNotificationModal\Plugin\MageSuiteFileUpload\Model\Widget\ReplaceUrlToWidgetImages::KEYS_IMAGE_URL as $imageUrl) {
            if (!empty($data[$imageUrl])) {
                $data[$imageUrl] = $this->parseFilePathFromMediaDirectoryUrl->execute($data[$imageUrl]);
            }
        }

        return [$key, $data];
    }
}
